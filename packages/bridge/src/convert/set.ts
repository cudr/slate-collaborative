import { toSlatePath, toJS } from '../utils/index'

const setData = ({ path, value }) => map => ({
  type: 'set_node',
  path: toSlatePath(path),
  properties: {},
  newProperties: {
    data: map[value]
  }
})

const setByType = {
  data: setData
}

const opSet = (op, [map, ops]) => {
  const { link, value, obj, key } = op
  try {
    const set = setByType[key]

    if (set) {
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
