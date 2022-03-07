import * as Automerge from 'automerge'
import { Operation, Node, SetNodeOperation, Element } from 'slate'
import { CollabMap, CollabOperation, SyncDoc } from '../model'

import { toSlatePath, toJS } from '../utils'
import { rootKey } from './constants'

const setDataOp = (
  { key = '', obj, path, value }: Automerge.Diff,
  doc: SyncDoc
) => (map: CollabMap) => {
  return {
    type: 'set_node',
    path: toSlatePath(path),
    properties: {
      [key]: Automerge.getObjectById(doc, obj)?.[key]
    },
    newProperties: {
      [key]: value
    }
  } as SetNodeOperation
}

/**
 * Convert a root level children update to slate operations.
 *
 * When we receive a root level children array update we need to handle that
 * operation as a special case since slate does not allow for setting the root
 * level node through a simple set_node operation
 */
const setChildren = (op: Automerge.Diff) => (map: CollabMap, doc: Element) => {
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

const opSet = (
  op: Automerge.Diff,
  [map, ops]: [CollabMap, CollabOperation[]],
  doc: SyncDoc
) => {
  const { link, value, path, obj, key } = op

  try {
    // Update our map to include the latest linked values if provided
    if (map[obj]) {
      map[obj][key as any] = link ? map[value] : value
    }

    // Ignore all cursor updates since those do not need to translate into
    // slate operations
    if (path && path.includes('cursors')) {
      return [map, ops]
    }

    // Handle updates received for the root children array
    if (obj === rootKey && key === 'children') {
      ops.push(setChildren(op))
    }
    // Handle other setNode operations
    else if (path && obj !== rootKey && path.length !== 0) {
      ops.push(setDataOp(op, doc))
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
