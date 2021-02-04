import * as Automerge from 'automerge'
import { Element, Node } from 'slate'

import { toSlatePath, toJS } from '../utils'

import { SyncDoc } from '../model'

const insertTextOp = ({ index, path, value }: Automerge.Diff) => (
  map: any,
  doc: Element
) => {
  const slatePath = toSlatePath(path)
  const node = Node.get(doc, slatePath)!
  const text = node.text! as string
  node.text = [text.slice(0, index), value, text.slice(index)].join('')
  return {
    type: 'insert_text',
    path: slatePath,
    offset: index,
    text: value,
    marks: []
  }
}

const insertNodeOp = (
  { value, obj, index, path }: Automerge.Diff,
  doc: any
) => (map: any, tmpDoc: Element) => {
  const ops: any = []

  const iterate = ({ children, ...json }: any, path: any) => {
    const node = toJS(children ? { ...json, children: [] } : json)

    ops.push({
      type: 'insert_node',
      path,
      node
    })

    // update the temp doc so later remove_node won't error.
    const parent = Node.parent(tmpDoc, path)
    const index = path[path.length - 1]
    parent.children.splice(index, 0, toJS(node))

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
  [map, ops]: any,
  doc: SyncDoc,
  tmpDoc: Element
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
    }
    if (path) {
      const insert = insertByType[type]

      const operation = insert && insert(op, doc)(map, tmpDoc)

      ops.push(operation)
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opInsert
