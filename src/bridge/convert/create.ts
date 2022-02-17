import * as Automerge from 'automerge'
import { CollabMap, CollabOperation } from '../model'

const createByType = (type: Automerge.CollectionType) =>
  type === 'map' ? {} : type === 'list' ? [] : ''

const opCreate = (
  { obj, type }: Automerge.Diff,
  [map, ops]: [CollabMap, CollabOperation[]]
) => {
  map[obj] = createByType(type)

  return [map, ops]
}

export default opCreate
