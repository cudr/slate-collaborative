import { Operation, Range } from 'slate'

import { CursorData } from '../model'

export const setCursor = (
  id: string,
  selection: Range | null,
  doc: any,
  operations: Operation[],
  cursorData: CursorData
) => {
  const cursorOps = operations.filter(op => op.type === 'set_selection')

  if (!doc.cursors) doc.cursors = {}

  const newCursor = cursorOps[cursorOps.length - 1]?.newProperties || {}

  if (selection) {
    doc.cursors[id] = Object.assign(
      doc.cursors[id] || {},
      newCursor,
      selection,
      {
        ...cursorData,
        isForward: Boolean(newCursor.focus)
      }
    )
  } else {
    delete doc.cursors[id]
  }

  return doc
}
