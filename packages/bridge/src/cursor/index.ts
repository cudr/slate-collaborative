import { toJS } from '../utils'

import { Operation } from 'slate'
import { List } from 'immutable'

export const setCursor = (
  doc,
  { id, selection, selectionOps, annotationType }
) => {
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

  if (selectionOps.size) {
    selectionOps.forEach(op => {
      const { newProperties } = op.toJSON()

      if (newProperties.focus) annotation.focus = newProperties.focus
      if (newProperties.anchor) annotation.anchor = newProperties.anchor
      if (newProperties.data) annotation.data = newProperties.data
    })
  }

  const cursorStart = annotation.anchor && annotation.anchor.offset
  const cursorEnd = annotation.focus && annotation.focus.offset

  console.log('cursor!!', cursorStart, cursorEnd)
  console.log(
    'selection!!',
    annotation,
    selection.start.offset,
    selection.end.offset
  )

  if (selection.start.offset !== cursorStart) {
    annotation.focus = selection.end.toJS() || {}
  }

  if (selection.end.offset !== cursorEnd) {
    annotation.anchor = selection.start.toJS() || {}
  }

  annotation.data.isBackward = selection.isBackward

  console.log('setted cursor', annotation, toJS(doc))

  doc.annotations[id] = annotation

  return doc
}

export const removeCursor = (doc, { id }) => {
  console.log('!!!removeCursor', doc, id)
  if (doc.annotations && doc.annotations[id]) {
    delete doc.annotations[id]
  }

  return doc
}

export const cursorOpFilter = (doc, ops: List<Operation>) =>
  ops.filter(op => {
    const { annotations } = doc

    if (op.type === 'set_annotation') {
      return !(
        (op.properties && annotations[op.properties.key]) ||
        (op.newProperties && annotations[op.newProperties.key])
      )
    } else if (
      op.type === 'add_annotation' ||
      op.type === 'remove_annotation'
    ) {
      return !annotations[op.annotation.key]
    }

    return true
  })
