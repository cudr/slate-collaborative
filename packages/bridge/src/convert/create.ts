import * as Automerge from 'automerge'

const createByType = type => (type === 'map' ? {} : type === 'list' ? [] : '')

const opCreate = ({ obj, type }: Automerge.Diff, [map, ops]) => {
  map[obj] = createByType(type)

  return [map, ops]
}

export default opCreate
