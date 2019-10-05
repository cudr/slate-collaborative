import { Block, Text } from 'slate'
import { toSlatePath, toJS } from '../utils/index'

const insertTextOp = ({ index, path, value }) => () => ({
  type: 'insert_text',
  path: toSlatePath(path),
  offset: index,
  text: value,
  marks: []
})

const insertNodeOp = ({ value, index, path }) => map => {
  const ops = []

  const insertRecoursive = ({ nodes, ...json }: any, path) => {
    const node = nodes
      ? Block.fromJSON({ ...json, nodes: [] })
      : Text.fromJSON(json)

    ops.push({
      type: 'insert_node',
      path,
      node
    })

    nodes && nodes.forEach((n, i) => insertRecoursive(n, [...path, i]))
  }

  insertRecoursive(map[value], [...toSlatePath(path), index])

  return ops
}

// let count = 4000

// const insertNodeOp = ({ value, index, path }) => map => {
//   const node = map[value]

//   if (!node) return null

//   count += 1

//   return {
//     type: 'insert_node',
//     path: [...toSlatePath(path), index],
//     node, //: { ...node, key: count },
//     data: {}
//   }
// }

const insertByType = {
  text: insertTextOp,
  list: insertNodeOp
}

const opInsert = (op, [map, ops]) => {
  try {
    const { link, obj, path, index, type, value } = op

    if (link && map[obj]) {
      map[obj].splice(index, 0, map[value] || value)
    } else if (type === 'text' && !path) {
      map[obj] = map[obj]
        ? map[obj]
            .slice(0, index)
            .concat(value)
            .concat(map[obj].slice(index))
        : value
    } else {
      const insert = insertByType[type]

      const operation = insert && insert(op, map)

      ops.push(operation)
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opInsert
