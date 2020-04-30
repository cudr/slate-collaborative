import Automerge from 'automerge'

import { Editor, Operation } from 'slate'

import {
  toJS,
  applySlateOps,
  toCollabAction,
  setCursor,
  toSlateOp,
  hexGen
} from '@slate-collaborative/bridge'

export interface CollabEditor extends Editor {
  clientId: string

  isRemote: boolean

  docSet: Automerge.DocSet<any>
  connection: Automerge.Connection<any>

  onConnectionMsg: (msg: Automerge.Message) => void

  openConnection: () => void
  closeConnection: () => void

  receiveDocument: (data: any) => void
  receiveOperation: (data: any) => void

  onCursor: (data: any) => void
}

/**
 * `CollabEditor` contains methods for collaboration-enabled editors.
 */

export const CollabEditor = {
  /**
   * Create Automerge connection
   */

  createConnection: (e: CollabEditor, emit: (data: any) => void) =>
    new Automerge.Connection(e.docSet, toCollabAction('operation', emit)),

  /**
   * Apply Slate operations to Automerge
   */

  applySlateOps: (
    e: CollabEditor,
    docId: string,
    operations: Operation[],
    cursorData: any
  ) => {
    try {
      const doc = e.docSet.getDoc(docId)

      if (!doc) {
        throw new TypeError(`Unknown docId: ${docId}!`)
      }

      const changed = Automerge.change(doc, hexGen(), (d: any) => {
        applySlateOps(d.children, operations)

        const cursorOps = operations.filter(op => op.type === 'set_selection')

        setCursor(e.clientId, e.selection, d, cursorOps, cursorData)
      })

      e.docSet.setDoc(docId, changed)
    } catch (e) {
      console.error(e)
    }
  },

  /**
   * Receive and apply document to Autmerge docSet
   */

  receiveDocument: (e: CollabEditor, docId: string, data: any) => {
    const currentDoc = e.docSet.getDoc(docId)

    const externalDoc = Automerge.load(data)

    const mergedDoc = Automerge.merge(
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

  applyOperation: (e: CollabEditor, docId: string, data: any) => {
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
