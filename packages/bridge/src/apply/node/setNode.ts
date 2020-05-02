import { SetNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getTarget } from '../../path'

const setNode = (doc: SyncDoc, op: SetNodeOperation): SyncDoc => {
  const node = getTarget(doc, op.path)

  const { type, data }: any = op.newProperties

  if (type) node.type = type

  if (!node.text && data) node.data = data

  return doc
}

export default setNode
