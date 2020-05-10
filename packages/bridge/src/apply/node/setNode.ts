import { SetNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getTarget } from '../../path'

const setNode = (doc: SyncDoc, op: SetNodeOperation): SyncDoc => {
  const node = getTarget(doc, op.path)

  const { newProperties } = op

  for (let key in newProperties) {
    node[key] = newProperties[key]
  }

  return doc
}

export default setNode
