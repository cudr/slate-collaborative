import { SyncDoc } from '../model'

import {
  SplitNodeOperation,
  InsertNodeOperation,
  MoveNodeOperation,
  RemoveNodeOperation,
  MergeNodeOperation,
  SetNodeOperation
} from 'slate'

import { getTarget, getParent } from '../path'
import { toJS, cloneNode, toSync } from '../utils'

export const insertNode = (doc: SyncDoc, op: InsertNodeOperation): SyncDoc => {
  const [parent, index] = getParent(doc, op.path)

  if (parent.object === 'text') {
    throw new TypeError('cannot insert node into text node')
  }

  parent.nodes.splice(index, 0, toSync(op.node.toJS()))

  return doc
}

export const moveNode = (doc: SyncDoc, op: MoveNodeOperation): SyncDoc => {
  const [from, fromIndex] = getParent(doc, op.path)
  const [to, toIndex] = getParent(doc, op.newPath)

  if (from.object === 'text' || to.object === 'text') {
    throw new TypeError('cannot move node as child of a text node')
  }

  to.nodes.splice(toIndex, 0, ...from.nodes.splice(fromIndex, 1))

  return doc
}

export const removeNode = (doc: SyncDoc, op: RemoveNodeOperation): SyncDoc => {
  const [parent, index] = getParent(doc, op.path)

  if (parent.object === 'text') {
    throw new TypeError('cannot remove node from text node')
  }

  parent.nodes.splice(index, 1)

  return doc
}

export const splitNode = (doc: SyncDoc, op: SplitNodeOperation): SyncDoc => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const target = parent.nodes[index]
  const inject = cloneNode(target)

  if (target.object === 'text') {
    target.text.length > op.position &&
      target.text.deleteAt(op.position, target.text.length - op.position)
    op.position && inject.text.deleteAt(0, op.position)
  } else {
    target.nodes.splice(op.position, target.nodes.length - op.position)
    op.position && inject.nodes.splice(0, op.position)
  }

  parent.nodes.insertAt(index + 1, inject)

  return doc
}

export const mergeNode = (doc: SyncDoc, op: MergeNodeOperation) => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const prev = parent.nodes[index - 1]
  const next = parent.nodes[index]

  if (prev.object === 'text') {
    prev.text.insertAt(prev.text.length, ...toJS(next.text).split(''))
  } else {
    next.nodes.forEach(n => prev.nodes.push(cloneNode(n)))
  }

  parent.nodes.deleteAt(index, 1)

  return doc
}

export const setNode = (doc: SyncDoc, op: SetNodeOperation) => {
  const node = getTarget(doc, op.path)

  const { type, data }: any = op.newProperties

  if (type) node.type = type
  if (node.object !== 'text' && data) node.data = data.toJSON()

  return doc
}

export default {
  insert_node: insertNode,
  move_node: moveNode,
  remove_node: removeNode,
  split_node: splitNode,
  merge_node: mergeNode,
  set_node: setNode
}
