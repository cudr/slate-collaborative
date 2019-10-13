import { Operation, Selection } from 'slate'
import { List } from 'immutable'
import merge from 'lodash/merge'

import { toJS } from '../utils'
import { SyncDoc, CursorKey } from '../model'

export const setCursor = (
  doc: SyncDoc,
  key: CursorKey,
  selection: Selection,
  type,
  data
) => {
  if (!doc) return

  if (!doc.annotations) {
    doc.annotations = {}
  }

  if (!doc.annotations[key]) {
    doc.annotations[key] = {
      key,
      type,
      data: {}
    }
  }

  const annotation = toJS(doc.annotations[key])

  annotation.focus = selection.end.toJSON()
  annotation.anchor = selection.start.toJSON()

  annotation.data = merge(annotation.data, data, {
    isBackward: selection.isBackward,
    targetPath: selection.isBackward
      ? annotation.anchor.path
      : annotation.focus.path
  })

  doc.annotations[key] = annotation

  return doc
}

export const removeCursor = (doc: SyncDoc, key: CursorKey) => {
  if (doc.annotations && doc.annotations[key]) {
    delete doc.annotations[key]
  }

  return doc
}

export const cursorOpFilter = (ops: List<Operation>, type: string) =>
  ops.filter(op => {
    if (op.type === 'set_annotation') {
      return !(
        (op.properties && op.properties.type === type) ||
        (op.newProperties && op.newProperties.type === type)
      )
    } else if (
      op.type === 'add_annotation' ||
      op.type === 'remove_annotation'
    ) {
      return op.annotation.type !== type
    }

    return true
  })
