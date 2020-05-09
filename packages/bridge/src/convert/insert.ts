import * as Automerge from 'automerge'

import { toSlatePath, toJS } from '../utils'

import { SyncDoc } from '../model'

const insertTextOp = ({ index, path, value }: Automerge.Diff) => () => ({
  type: 'insert_text',
  path: toSlatePath(path),
  offset: index,
  text: value,
  marks: []
})

const insertNodeOp = (
  { value, obj, index, path }: Automerge.Diff,
  doc: any
) => (map: any) => {
  const ops: any = []

  const iterate = ({ children, ...json }: any, path: any) => {
    const node = children ? { ...json, children: [] } : json

    ops.push({
      type: 'insert_node',
      path,
      node
    })

    children &&
      children.forEach((n: any, i: any) => {
        const node = map[n] || Automerge.getObjectById(doc, n)

        iterate((node && toJS(node)) || n, [...path, i])
      })
  }

  const source =
    map[value] || toJS(map[obj] || Automerge.getObjectById(doc, value))

  source && iterate(source, [...toSlatePath(path), index])

  return ops
}

const insertByType = {
  text: insertTextOp,
  list: insertNodeOp
}

const opInsert = (op: Automerge.Diff, [map, ops]: any, doc: SyncDoc) => {
  try {
    const { link, obj, path, index, type, value } = op

    if (link && map.hasOwnProperty(obj)) {
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

      const operation = insert && insert(op, doc)

      ops.push(operation)
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opInsert
