import { SplitNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getParent } from '../../path'
import { cloneNode } from '../../utils'

const splitNode = (doc: SyncDoc, op: SplitNodeOperation): SyncDoc => {
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

export default splitNode
