import { toJS } from '../utils'

import { Operation } from 'slate'
import { List } from 'immutable'

export const setCursor = (doc, { id, selection, annotationType }) => {
  if (!doc.annotations) {
    doc.annotations = {}
  }

  if (!doc.annotations[id]) {
    doc.annotations[id] = {
      key: id,
      type: annotationType,
      data: {}
    }
  }

  const annotation = toJS(doc.annotations[id])

  // if (selectionOps.size) {
  //   selectionOps.forEach(op => {
  //     const { newProperties } = op.toJSON()

  //     if (newProperties.focus) annotation.focus = newProperties.focus
  //     if (newProperties.anchor) annotation.anchor = newProperties.anchor
  //     if (newProperties.data) annotation.data = newProperties.data
  //   })
  // }

  // console.log('cursor!!', cursorStart, cursorEnd)
  // console.log(
  //   'selection!!',
  //   selection.toJSON(),
  //   selection.start.offset,
  //   selection.end.offset
  // )

  annotation.focus = selection.end.toJSON() || {}
  annotation.anchor = selection.start.toJSON() || {}

  annotation.data.isBackward = selection.isBackward
  annotation.data.targetPath = selection.isBackward
    ? annotation.anchor.path
    : annotation.focus.path

  doc.annotations[id] = annotation

  return doc
}

export const removeCursor = (doc, { id }) => {
  // console.log('!!!removeCursor', doc, id)
  if (doc.annotations && doc.annotations[id]) {
    delete doc.annotations[id]
  }

  return doc
}

export const cursorOpFilter = (ops: List<Operation>, annotationType) =>
  ops.filter(op => {
    if (op.type === 'set_annotation') {
      return !(
        (op.properties && op.properties.type === annotationType) ||
        (op.newProperties && op.newProperties.type === annotationType)
      )
    } else if (
      op.type === 'add_annotation' ||
      op.type === 'remove_annotation'
    ) {
      return op.annotation.type !== annotationType
    }

    return true
  })
