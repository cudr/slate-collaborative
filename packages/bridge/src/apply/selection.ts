import { toJS } from '../utils'

const setSelection = (doc, op, { id, selection, annotationType }) => {
  if (!doc.cursors) {
    doc.cursors = {}
  }

  const operation = op.toJS()

  if (!doc.cursors[id]) {
    doc.cursors[id] = {
      key: id,
      type: annotationType,
      data: {}
    }
  }

  const cursor = doc.cursors[id]
  const { focus, anchor } = operation.newProperties

  if (focus) cursor.focus = focus
  if (anchor) cursor.anchor = anchor

  const cursorPath = cursor.data.isBackward
    ? anchor && anchor.path
    : focus && focus.path

  if (cursorPath) cursor.data.cursorPath = toJS(cursorPath)

  cursor.data.isBackward = selection.isBackward

  return doc
}

export default {
  set_selection: setSelection
}
