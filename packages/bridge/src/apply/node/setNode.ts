import { SetNodeOperation } from 'slate'

import { SyncValue } from '../../model'
import { getTarget } from '../../path'

const setNode = (doc: SyncValue, op: SetNodeOperation): SyncValue => {
  const node = getTarget(doc, op.path)

  const { newProperties } = op

  for (let key in newProperties) {
    const value = newProperties[key]
    if (value !== undefined) {
      node[key] = value
    } else {
      delete node[key]
    }
  }

  return doc
}

export default setNode
