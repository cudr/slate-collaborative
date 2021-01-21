import * as Automerge from 'automerge'

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

const opSet = (op: Automerge.Diff, [map, ops]: any, doc: any) => {
  const { link, value, path, obj, key } = op

  try {
    // We can ignore any root level cursor updates since those
    // will not correspond to any slate operations
    if (obj === rootKey && key === 'cursors') {
      return [map, ops]
    }

    // Handle updates received for the root children array
    if (obj === rootKey && key === 'children' && map[value]) {
      // First remove all existing child nodes
      for (let i = doc.children.length - 1; i >= 0; i--) {
        ops.push((map: any) => ({
          type: 'remove_node',
          path: [i],
          node: doc.children[i]
        }))
      }

      // Then add all the newly defined nodes
      const newChildren: Node[] = map[value]
      newChildren.forEach((child, index) => {
        ops.push((map: any) => ({
          type: 'insert_node',
          path: [index],
          node: child
        }))
      })

      return [map, ops]
    }

    if (path && path[0] !== 'cursors') {
      ops.push(setDataOp(op, doc))
    } else if (map[obj]) {
      map[obj][key as any] = link ? map[value] : value
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
