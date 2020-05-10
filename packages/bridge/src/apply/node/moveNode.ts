import { MoveNodeOperation } from 'slate'

import { cloneNode } from '../../utils'
import { SyncDoc } from '../../model'
import { getParent, getChildren } from '../../path'

const moveNode = (doc: SyncDoc, op: MoveNodeOperation): SyncDoc => {
  const [from, fromIndex] = getParent(doc, op.path)
  const [to, toIndex] = getParent(doc, op.newPath)

  if (from.text || to.text) {
    throw new TypeError("Can't move node as child of a text node")
  }

  getChildren(to).splice(
    toIndex,
    0,
    ...getChildren(from)
      .splice(fromIndex, 1)
      .map(cloneNode)
  )

  return doc
}

export default moveNode
