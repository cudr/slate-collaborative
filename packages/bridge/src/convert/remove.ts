import * as Automerge from 'automerge'
import { Element } from 'slate'

import { toSlatePath, toJS } from '../utils'
import { getTarget } from '../path'
import { rootKey } from './constants'

const removeTextOp = (op: Automerge.Diff) => (map: any, doc: Element) => {
  const { index, path, obj } = op

  const slatePath = toSlatePath(path).slice(0, path?.length)

  const node = getTarget(doc, slatePath) || map[obj]

  // if we are removing text for a node that has already been removed
  // treat this as a noop
  if (!node) {
    return
  }

  if (typeof index !== 'number') return

  const text = node?.text?.[index] || '*'

  if (node && node.text) {
    node.text = node.text.slice(0, index) + node.text.slice(index + 1)
  }

  return {
    type: 'remove_text',
    path: slatePath,
    offset: index,
    text
  }
}

const removeNodeOp = ({ index, obj, path }: Automerge.Diff) => (
  map: any,
  doc: Element
) => {
  const slatePath = toSlatePath(path)

  const parent = getTarget(doc, slatePath)

  // if we are removing a node that has already been removed
  // treat this as a noop
  if (!parent) return

  const target = parent?.children?.[index as number] || { children: [] }

  if (!map.hasOwnProperty(obj)) {
    map[obj] = target
  }

  return {
    type: 'remove_node',
    path: slatePath.length ? slatePath.concat(index) : [index],
    node: target
  }
}

const opRemove = (op: Automerge.Diff, [map, ops]: any) => {
  try {
    const { index, path, obj, type } = op

    if (
      map.hasOwnProperty(obj) &&
      typeof map[obj] !== 'string' &&
      map[obj].splice &&
      type !== 'text'
    ) {
      map[obj].splice(index, 1)

      return [map, ops]
    }

    if (!path) return [map, ops]

    const key = path[path.length - 1]

    if (key === 'cursors') return [map, ops]
    // if we don't have a valid key and this is the root obj no slate op is needed
    if (key === undefined && obj === rootKey) return [map, ops]

    const fn = key === 'text' ? removeTextOp : removeNodeOp

    return [map, [...ops, fn(op)]]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opRemove
