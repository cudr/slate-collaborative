import { Operation } from 'slate'

import merge from 'lodash/merge'

export const setCursor = (
  id: string,
  selection: any = {},
  doc: any,
  operations: Operation[],
  cursorData: any = {}
) => {
  const cursorOps = operations.filter(op => op.type === 'set_selection')

  if (!doc.cursors) doc.cursors = {}

  const newCursor = cursorOps[cursorOps.length - 1]?.newProperties || {}

  if (selection) {
    doc.cursors[id] = merge(doc.cursors[id] || {}, newCursor, selection, {
      ...cursorData,
      isForward: Boolean(newCursor.focus)
    })
  } else {
    delete doc.cursors[id]
  }

  return doc
}
