import * as Automerge from 'automerge'
import { Operation, Node } from 'slate'

import { toSlatePath, toJS } from '../utils'
import { rootKey } from './constants'

const setDataOp = (
  { key = '', obj, path, value }: Automerge.Diff,
  doc: any
) => (map: any) => {
  return {
    type: 'set_node',
    path: toSlatePath(path),
    properties: {
      [key]: Automerge.getObjectById(doc, obj)?.[key]
    },
    newProperties: {
      [key]: value
    }
  }
}

const setChildren = (op: Automerge.Diff, doc: any) => (map: any) => {
  const { value } = op

  const ops: Operation[] = []

  let newValue = map[value]
  if (!newValue) {
    return ops
  }

  // First remove all existing child nodes
  for (let i = doc.children.length - 1; i >= 0; i--) {
    ops.push({
      type: 'remove_node',
      path: [i],
      node: doc.children[i]
    })
  }

  // Then add all the newly defined nodes
  const newChildren: Node[] = newValue
  newChildren.forEach((child, index) => {
    ops.push({
      type: 'insert_node',
      path: [index],
      node: child
    })
  })

  return ops
}

const opSet = (op: Automerge.Diff, [map, ops]: any, doc: any) => {
  const { link, value, path, obj, key } = op

  try {
    if (map[obj]) {
      map[obj][key as any] = link ? map[value] : value
    }

    // ignore all cursor updates since those do not need to translate into
    // slate operations
    if (path && path.includes('cursors')) {
      return [map, ops]
    }

    // Handle updates received for the root children array
    if (obj === rootKey && key === 'children') {
      ops.push(setChildren(op, doc))
    } else if (path && obj !== rootKey && !path.includes('cursors')) {
      ops.push(setDataOp(op, doc))
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
