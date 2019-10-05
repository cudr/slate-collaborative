import { toSlatePath, toJS } from '../utils/index'

const insertTextOp = ({ index, path, value }) => () => ({
  type: 'insert_text',
  path: toSlatePath(path),
  offset: index,
  text: value,
  marks: []
})

const insertNodeOp = ({ value, index, path }) => map => ({
  type: 'insert_node',
  path: [...toSlatePath(path), index],
  node: map[value]
})

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
