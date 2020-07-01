import * as Automerge from 'automerge'
import { Element } from 'slate'

import { toSlatePath, toJS } from '../utils'
import { getTarget } from '../path'

const removeTextOp = (op: Automerge.Diff) => (map: any, doc: Element) => {
  const { index, path, obj } = op

  const slatePath = toSlatePath(path).slice(0, path?.length)

  let node

  try {
    node = getTarget(doc, slatePath) || map[obj]
  } catch (e) {
    console.error(e, op, doc)
  }

  if (typeof index !== 'number') return

  const text = node?.text[index] || '*'

  if (node) {
    node.text = node.text?.slice(0, index) + node.text?.slice(index + 1)
  }

  return {
    type: 'remove_text',
    path: slatePath,
    offset: index,
    text,
    marks: []
  }
}

const removeNodeOp = ({ index, obj, path }: Automerge.Diff) => (
  map: any,
  doc: Element
) => {
  const slatePath = toSlatePath(path)

  const parent = getTarget(doc, slatePath)
  const target = parent?.children[index as number] || { children: [] }

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
      type !== 'text'
    ) {
      map[obj].splice(index, 1)

      return [map, ops]
    }

    if (!path) return [map, ops]

    const key = path[path.length - 1]

    if (key === 'cursors') return [map, ops]

    const fn = key === 'text' ? removeTextOp : removeNodeOp

    return [map, [...ops, fn(op)]]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opRemove
