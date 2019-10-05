import { getTarget } from '../path'
import { toSync } from '../utils'
import { SyncDoc } from '../model'

import { AddMarkOperation, RemoveMarkOperation, SetMarkOperation } from 'slate'

const findIndex = (node, mark) =>
  node.marks.findIndex(m => m.type === mark.type)

export const addMark = (doc: SyncDoc, op: AddMarkOperation) => {
  const node = getTarget(doc, op.path)

  if (node.object !== 'text') {
    throw new TypeError('cannot set marks on non-text node')
  }

  if (findIndex(node, op.mark) < 0) node.marks.push(toSync(op.mark.toJS()))

  return doc
}

export const removeMark = (doc: SyncDoc, op: RemoveMarkOperation) => {
  const node = getTarget(doc, op.path)

  if (node.object !== 'text') {
    throw new TypeError('cannot set marks on non-text node')
  }

  const index = findIndex(node, op.mark)

  if (index >= 0) node.marks.splice(index, 1)

  return doc
}

export const setMark = (doc: SyncDoc, op: SetMarkOperation) => {
  const node = getTarget(doc, op.path)

  if (node.object !== 'text') {
    throw new TypeError('cannot set marks on non-text node')
  }

  const index = findIndex(node, op.properties)

  if (index === -1) {
    console.warn('did not find old mark with properties', op.properties)

    if (!op.newProperties.type) {
      throw new TypeError('no old mark, and new mark missing type')
    }

    node.marks.push({
      object: 'mark',
      type: op.newProperties.type,
      ...op.newProperties
    })
  } else {
    node.marks[index] = {
      object: 'mark',
      ...node.marks[index],
      ...op.newProperties
    }
  }

  return doc
}

export default {
  add_mark: addMark,
  remove_mark: removeMark,
  set_mark: setMark
}
