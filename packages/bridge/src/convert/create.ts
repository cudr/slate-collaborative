import * as Automerge from 'automerge'

const createByType = (type: any) =>
  type === 'map' ? {} : type === 'list' ? [] : ''

const opCreate = ({ obj, type }: Automerge.Diff, [map, ops]: any) => {
  map[obj] = createByType(type)

  return [map, ops]
}

export default opCreate
