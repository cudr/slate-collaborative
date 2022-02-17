import { BaseSetNodeOperation, Operation, Range } from 'slate'

import { CursorData } from '../model'
import { toJS } from '../utils'

export const setCursor = (
  id: string,
  selection: Range | null,
  doc: any,
  operations: Operation[],
  cursorData: CursorData
) => {
  try {
    const cursorOps = operations.filter(op => op.type === 'set_selection')

    if (!doc.cursors) doc.cursors = {}

    const newCursor =
      (cursorOps[cursorOps.length - 1] as BaseSetNodeOperation)
        ?.newProperties || {}

    if (selection) {
      const newCursorData = Object.assign(
        (doc.cursors[id] && JSON.parse(doc.cursors[id])) || {},
        newCursor,
        selection,
        {
          ...cursorData,
          isForward: Range.isForward(selection)
        }
      )

      doc.cursors[id] = JSON.stringify(newCursorData)
    } else {
      delete doc.cursors[id]
    }
  } catch (e) {
    console.error(e, toJS(doc))
  }

  return doc
}
