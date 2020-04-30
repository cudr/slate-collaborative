import {
  Editor,
  SplitNodeOperation,
  InsertNodeOperation,
  MoveNodeOperation,
  RemoveNodeOperation,
  MergeNodeOperation,
  SetNodeOperation
} from 'slate'

import { getTarget, getParent } from '../path'
import { toJS, cloneNode, toSync } from '../utils'

export const insertNode = (doc: Editor, op: InsertNodeOperation): Editor => {
  const [parent, index] = getParent(doc, op.path)

  if (parent.text) {
    throw new TypeError('cannot insert node into text node')
  }

  parent.children
    ? parent.children.splice(index, 0, toSync(op.node))
    : parent.splice(index, 0, toSync(op.node))

  return doc
}

export const moveNode = (doc: Editor, op: MoveNodeOperation): Editor => {
  const [from, fromIndex] = getParent(doc, op.path)
  const [to, toIndex] = getParent(doc, op.newPath)

  if (from.text || to.text) {
    throw new TypeError('cannot move node as child of a text node')
  }

  to.children.splice(toIndex, 0, ...from.children.splice(fromIndex, 1))

  return doc
}

export const removeNode = (doc: Editor, op: RemoveNodeOperation): Editor => {
  const [parent, index] = getParent(doc, op.path)

  if (parent.text) {
    throw new TypeError('cannot remove node from text node')
  }

  parent.children ? parent.children.splice(index, 1) : parent.splice(index, 1)

  return doc
}

export const splitNode = (doc: Editor, op: SplitNodeOperation): Editor => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const hasChildren = !!parent.children

  const target = hasChildren ? parent.children[index] : parent[index]
  const inject = cloneNode(target)

  if (target.text) {
    target.text.length > op.position &&
      target.text.deleteAt(op.position, target.text.length - op.position)
    op.position && inject.text.deleteAt(0, op.position)
  } else {
    target.children.splice(op.position, target.children.length - op.position)
    op.position && inject.children.splice(0, op.position)
  }

  hasChildren
    ? parent.children.insertAt(index + 1, inject)
    : parent.insertAt(index + 1, inject)

  return doc
}

export const mergeNode = (doc: Editor, op: MergeNodeOperation) => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const prev = parent[index - 1] || parent.children[index - 1]
  const next = parent[index] || parent.children[index]

  if (prev.text) {
    prev.text.insertAt(prev.text.length, ...toJS(next.text).split(''))
  } else {
    next.children.forEach((n: any) => prev.children.push(cloneNode(n)))
  }

  parent.children
    ? parent.children.deleteAt(index, 1)
    : parent.deleteAt(index, 1)

  return doc
}

export const setNode = (doc: Editor, op: SetNodeOperation) => {
  const node = getTarget(doc, op.path)

  const { type, data }: any = op.newProperties

  if (type) node.type = type
  if (!node.text && data) node.data = data

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
