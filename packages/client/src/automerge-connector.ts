import Automerge from 'automerge'

import { Editor, Operation } from 'slate'
import { HistoryEditor } from 'slate-history'

import {
  toJS,
  SyncDoc,
  CollabAction,
  toCollabAction,
  applyOperation,
  setCursor,
  toSlateOp,
  CursorData
} from '@hiveteams/collab-bridge'
import { AutomergeEditor } from './interfaces'

/**
 * `AutomergeEditor` contains methods for collaboration-enabled editors.
 */

export const AutomergeConnector = {
  /**
   * Create Automerge connection
   */

  createConnection: (e: AutomergeEditor, emit: (data: CollabAction) => void) =>
    new Automerge.Connection(e.docSet, toCollabAction('operation', emit)),

  /**
   * Apply Slate operations to Automerge
   */

  applySlateOps: (
    e: AutomergeEditor,
    docId: string,
    operations: Operation[],
    cursorData?: CursorData
  ) => {
    const doc = e.docSet.getDoc(docId)

    if (!doc) {
      throw new TypeError('Cannot apply slate ops for missing docId')
    }

    let changed: any

    operations.forEach(op => {
      changed = Automerge.change<SyncDoc>(changed || doc, d =>
        applyOperation(d.children, op)
      )
    })

    changed = Automerge.change(changed || doc, d => {
      setCursor(e.clientId, e.selection, d, operations, cursorData || {})
    })

    e.docSet.setDoc(docId, changed)
  },

  /**
   * Receive and apply document to Automerge docSet
   */

  receiveDocument: (e: AutomergeEditor, docId: string, data: string) => {
    const currentDoc = e.docSet.getDoc(docId)

    const externalDoc = Automerge.load<SyncDoc>(data)

    const mergedDoc = Automerge.merge<SyncDoc>(
      externalDoc,
      currentDoc || Automerge.init()
    )

    e.docSet.setDoc(docId, mergedDoc)

    Editor.withoutNormalizing(e, () => {
      e.children = toJS(mergedDoc).children

      e.onChange()
    })
  },

  /**
   * Generate automerge diff, convert and apply operations to Editor
   */

  applyOperation: (
    e: AutomergeEditor,
    docId: string,
    data: Automerge.Message,
    preserveExternalHistory?: boolean
  ) => {
    try {
      const current = e.docSet.getDoc(docId)

      const updated = e.connection.receiveMsg(data)

      const operations = Automerge.diff(current, updated)

      if (operations.length) {
        const slateOps = toSlateOp(operations, current)

        e.isRemote = true

        Editor.withoutNormalizing(e, () => {
          if (HistoryEditor.isHistoryEditor(e) && !preserveExternalHistory) {
            HistoryEditor.withoutSaving(e, () => {
              slateOps.forEach((o: Operation) => e.apply(o))
            })
          } else {
            slateOps.forEach((o: Operation) => e.apply(o))
          }

          e.onCursor && e.onCursor(updated.cursors)
        })

        Promise.resolve().then(_ => (e.isRemote = false))
      }
    } catch (e) {
      // unset remove flag
      if (e.isRemote) {
        e.isRemote = false
      }

      throw e
    }
  },

  garbageCursor: (e: AutomergeEditor, docId: string) => {
    const doc = e.docSet.getDoc(docId)

    // if the document has already been cleaned up
    // return early and do nothing
    if (!doc) return

    const changed = Automerge.change<SyncDoc>(doc, (d: any) => {
      delete d.cursors
    })

    e.docSet.setDoc(docId, changed as any)

    e.onCursor && e.onCursor(null)

    e.onChange()
  }
}
