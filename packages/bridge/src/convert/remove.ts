import { toSlatePath, toJS } from '../utils/index'

const removeTextOp = ({ index, path }) => () => ({
  type: 'remove_text',
  path: toSlatePath(path).slice(0, path.length),
  offset: index,
  text: '*',
  marks: []
})

const removeNodesOp = ({ index, path }) => () => {
  const nPath = toSlatePath(path)
  return {
    type: 'remove_node',
    path: nPath.length ? nPath.concat(index) : [index],
    node: {
      object: 'text'
    }
  }
}

const removeByType = {
  text: removeTextOp,
  nodes: removeNodesOp
}

const opRemove = (op, [map, ops]) => {
  try {
    const { index, path, obj } = op

    if (map.hasOwnProperty(obj) && op.type !== 'text') {
      map[obj].splice(index, 1)

      return [map, ops]
    }

    if (!path) return [map, ops]

    const fn = removeByType[path[path.length - 1]]

    return [map, [...ops, fn(op)]]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opRemove
