import * as Automerge from 'automerge'

import { toSlatePath, toJS } from '../utils'

import { CollabMap, CollabOperation, SyncDoc } from '../model'
import { Operation } from 'slate'

const insertTextOp = ({ index, path, value }: Automerge.Diff) => () => ({
  type: 'insert_text',
  path: toSlatePath(path),
  offset: index,
  text: value
})

const insertNodeOp = (
  { value, obj, index, path }: Automerge.Diff,
  doc: SyncDoc
) => (map: CollabMap) => {
  const ops: Operation[] = []

  const iterate = ({ children, ...json }: any, path: any) => {
    if (children && children.length === 1 && children[0].text === '') {
      ops.push({
        type: 'insert_node',
        path,
        node: { children, ...json }
      })
      return
    }

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

const opInsert = (
  op: Automerge.Diff,
  [map, ops]: [CollabMap, CollabOperation[]],
  doc: SyncDoc
) => {
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
