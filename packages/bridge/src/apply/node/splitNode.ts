import { SplitNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getParent, getChildren } from '../../path'
import { cloneNode } from '../../utils'

const splitNode = (doc: SyncDoc, op: SplitNodeOperation): SyncDoc => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const target = getChildren(parent)[index]
  const inject = cloneNode(target)

  if (target.text) {
    target.text.length > op.position &&
      target.text.deleteAt(op.position, target.text.length - op.position)
    op.position && inject.text.deleteAt(0, op.position)
  } else {
    target.children.splice(op.position, target.children.length - op.position)
    op.position && inject.children.splice(0, op.position)
  }

  getChildren(parent).insertAt(index + 1, inject)

  return doc
}

export default splitNode
