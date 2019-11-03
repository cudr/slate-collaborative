import * as Automerge from 'automerge'
import { toSlatePath, toJS } from '../utils/index'

const insertTextOp = ({ index, path, value }: Automerge.Diff) => () => ({
  type: 'insert_text',
  path: toSlatePath(path),
  offset: index,
  text: value,
  marks: []
})

const insertNodeOp = ({ value, obj, index, path }: Automerge.Diff) => map => {
  const ops = []

  const iterate = ({ nodes, ...json }, path) => {
    const node = nodes ? { ...json, nodes: [] } : json

    if (node.object) {
      if (node.object === 'mark') {
        ops.push({
          type: 'add_mark',
          path: path.slice(0, -1),
          mark: node
        })
      } else {
        ops.push({
          type: 'insert_node',
          path,
          node
        })
      }
    }

    nodes && nodes.forEach((n, i) => iterate(n, [...path, i]))
  }

  const source = map[value] || (map[obj] && toJS(map[obj]))

  source && iterate(source, [...toSlatePath(path), index])

  return ops
}

const insertByType = {
  text: insertTextOp,
  list: insertNodeOp
}

const opInsert = (op: Automerge.Diff, [map, ops]) => {
  try {
    const { link, obj, path, index, type, value } = op

    if (link && map[obj]) {
      map[obj].splice(index, 0, map[value] || value)
    } else if ((type === 'text' || type === 'list') && !path) {
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
