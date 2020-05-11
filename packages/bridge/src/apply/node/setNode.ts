import { SetNodeOperation } from 'slate'

import { SyncValue } from '../../model'
import { getTarget } from '../../path'

const setNode = (doc: SyncValue, op: SetNodeOperation): SyncValue => {
  const node = getTarget(doc, op.path)

  const { newProperties } = op

  for (let key in newProperties) {
    node[key] = newProperties[key]
  }

  return doc
}

export default setNode
