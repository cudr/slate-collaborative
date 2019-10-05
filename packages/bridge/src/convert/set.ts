import { toJS } from '../utils/index'

const opSet = (op, [map, ops]) => {
  const { link, value, obj, key } = op
  try {
    map[obj][key] = link ? map[value] : value

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
