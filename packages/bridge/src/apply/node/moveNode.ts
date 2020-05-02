import { MoveNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getParent } from '../../path'

const moveNode = (doc: SyncDoc, op: MoveNodeOperation): SyncDoc => {
  const [from, fromIndex] = getParent(doc, op.path)
  const [to, toIndex] = getParent(doc, op.newPath)

  if (from.text || to.text) {
    throw new TypeError("Can't move node as child of a text node")
  }

  to.children.splice(toIndex, 0, ...from.children.splice(fromIndex, 1))

  return doc
}

export default moveNode
