import Automerge from 'automerge'

import { Editor, Operation } from 'slate'

import {
  toJS,
  SyncDoc,
  applySlateOps,
  CollabAction,
  toCollabAction,
  setCursor,
  toSlateOp,
  CursorData
} from '@slate-collaborative/bridge'

export interface CollabEditor extends Editor {
  clientId: string

  isRemote: boolean

  docSet: Automerge.DocSet<SyncDoc>
  connection: Automerge.Connection<SyncDoc>

  onConnectionMsg: (msg: Automerge.Message) => void

  openConnection: () => void
  closeConnection: () => void

  receiveDocument: (data: string) => void
  receiveOperation: (data: Automerge.Message) => void

  onCursor: (data: any) => void
}

/**
 * `CollabEditor` contains methods for collaboration-enabled editors.
 */

export const CollabEditor = {
  /**
   * Create Automerge connection
   */

  createConnection: (e: CollabEditor, emit: (data: CollabAction) => void) =>
    new Automerge.Connection(e.docSet, toCollabAction('operation', emit)),

  /**
   * Apply Slate operations to Automerge
   */

  applySlateOps: (
    e: CollabEditor,
    docId: string,
    operations: Operation[],
    cursorData?: CursorData
  ) => {
    try {
      const doc = e.docSet.getDoc(docId)

      if (!doc) {
        throw new TypeError(`Unknown docId: ${docId}!`)
      }

      const changed = Automerge.change(doc, d => {
        applySlateOps(d.children, operations)

        const cursorOps = operations.filter(op => op.type === 'set_selection')

        setCursor(e.clientId, e.selection, d, cursorOps, cursorData || {})
      })

      e.docSet.setDoc(docId, changed)
    } catch (e) {
      console.error(e)
    }
  },

  /**
   * Receive and apply document to Automerge docSet
   */

  receiveDocument: (e: CollabEditor, docId: string, data: string) => {
    const currentDoc = e.docSet.getDoc(docId)

    const externalDoc = Automerge.load<SyncDoc>(data)

    const mergedDoc = Automerge.merge<SyncDoc>(
      currentDoc || Automerge.init(),
      externalDoc
    )

    e.children = toJS(mergedDoc).children

    e.docSet.setDoc(docId, mergedDoc)

    e.onChange()
  },

  /**
   * Generate automerge diff, convert and apply operations to Editor
   */

  applyOperation: (e: CollabEditor, docId: string, data: Automerge.Message) => {
    try {
      const current: any = e.docSet.getDoc(docId)

      const updated = e.connection.receiveMsg(data)

      const operations = Automerge.diff(current, updated)

      if (operations.length) {
        const slateOps = toSlateOp(operations, current)

        e.isRemote = true

        Editor.withoutNormalizing(e, () => {
          slateOps.forEach((o: Operation) => {
            e.apply(o)
          })
        })

        e.onCursor && e.onCursor(updated.cursors)

        Promise.resolve().then(_ => (e.isRemote = false))
      }
    } catch (e) {
      console.error(e)
    }
  }
}
