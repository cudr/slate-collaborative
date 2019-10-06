import * as Automerge from 'automerge'
import { toSlatePath, toJS } from '../utils/index'

const setDataOp = ({ path, value }: Automerge.Diff) => map => ({
  type: 'set_node',
  path: toSlatePath(path),
  properties: {},
  newProperties: {
    data: map[value]
  }
})

const setByType = {
  data: setDataOp
}

const opSet = (op: Automerge.Diff, [map, ops]) => {
  const { link, value, path, obj, key } = op
  try {
    const set = setByType[key]

    if (set && path) {
      ops.push(set(op))
    } else {
      map[obj][key] = link ? map[value] : value
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
