import { InsertNodeOperation } from 'slate'

import { SyncValue } from '../../model'
import { getParent, getChildren } from '../../path'
import { toSync } from '../../utils'

const insertNode = (doc: SyncValue, op: InsertNodeOperation): SyncValue => {
  const [parent, index] = getParent(doc, op.path)

  if (parent.text) {
    throw new TypeError("Can't insert node into text node")
  }

  getChildren(parent).splice(index, 0, toSync(op.node))

  return doc
}

export default insertNode
