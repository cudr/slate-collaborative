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
} from 'bridge'
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

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]

      try {
        changed = Automerge.change<SyncDoc>(changed || doc, d =>
          applyOperation(d.children, op)
        )
      } catch (err) {
        e.handleError(err, {
          type: 'applySlateOps - applyOperation',
          automergeChanged: Automerge.save(changed || doc),
          operation: op
        })

        // return early to avoid applying any further operations after we encounter an error
        return
      }
    }

    try {
      changed = Automerge.change(changed || doc, d => {
        setCursor(e.clientId, e.selection, d, operations, cursorData || {})
      })
    } catch (err) {
      e.handleError(err, {
        type: 'applySlateOps - setCursor',
        clientId: e.clientId,
        automergeDocument: Automerge.save(changed || doc),
        operations,
        cursorData
      })
    }

    e.docSet.setDoc(docId, changed)
  },

  /**
   * Receive and apply document to Automerge docSet
   */

  receiveDocument: (e: AutomergeEditor, docId: string, data: string) => {
    let currentDoc: Automerge.FreezeObject<SyncDoc> | null = null
    let externalDoc: Automerge.FreezeObject<SyncDoc> | null = null
    let mergedDoc: Automerge.FreezeObject<SyncDoc> | null = null

    try {
      currentDoc = e.docSet.getDoc(docId)
      externalDoc = Automerge.load<SyncDoc>(data)
      mergedDoc = Automerge.merge<SyncDoc>(
        externalDoc,
        currentDoc || Automerge.init()
      )

      e.docSet.setDoc(docId, mergedDoc)

      Editor.withoutNormalizing(e, () => {
        e.children = toJS(mergedDoc).children
        e.onChange()
      })
    } catch (err) {
      e.handleError(err, {
        type: 'receiveDocument',
        currentDoc: currentDoc && Automerge.save(currentDoc),
        externalDoc: externalDoc && Automerge.save(externalDoc),
        mergedDoc: mergedDoc && Automerge.save(mergedDoc)
      })
    }
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
        let slateOps: any[] = []
        try {
          slateOps = toSlateOp(operations, current)
        } catch (err) {
          e.handleError(err, {
            type: 'applyOperation - toSlateOp',
            operations,
            current: Automerge.save(current),
            updated: Automerge.save(updated)
          })
        }

        e.isRemote = true

        Editor.withoutNormalizing(e, () => {
          try {
            if (HistoryEditor.isHistoryEditor(e) && !preserveExternalHistory) {
              HistoryEditor.withoutSaving(e, () => {
                slateOps.forEach((o: Operation) => e.apply(o))
              })
            } else {
              slateOps.forEach((o: Operation) => e.apply(o))
            }
          } catch (err) {
            e.handleError(err, {
              type: 'applyOperation - slateOps apply',
              operations,
              slateOps,
              current: Automerge.save(current),
              updated: Automerge.save(updated)
            })
          }

          e.onCursor && e.onCursor(updated.cursors)
        })

        Promise.resolve().then(_ => (e.isRemote = false))
      }
    } catch (err) {
      // unset remote flag
      if (e.isRemote) {
        e.isRemote = false
      }

      const current = e.docSet.getDoc(docId)
      e.handleError(err, {
        type: 'applyOperation',
        data,
        current: current ? Automerge.save(current) : null
      })
    }
  },

  garbageCursor: (e: AutomergeEditor, docId: string) => {
    const doc = e.docSet.getDoc(docId)

    // if the document has already been cleaned up
    // return early and do nothing
    if (!doc) return

    const changed = Automerge.change<SyncDoc>(doc, (d: any) => {
      d.cursors = {}
    })

    e.docSet.setDoc(docId, changed as any)

    e.onCursor && e.onCursor(null)

    e.onChange()
  }
}
