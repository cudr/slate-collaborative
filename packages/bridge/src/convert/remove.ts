import * as Automerge from 'automerge'
import { Element } from 'slate'

import { toSlatePath, toJS } from '../utils'
import { getTarget } from '../path'

const removeTextOp = (op: Automerge.Diff) => (map: any, doc: Element) => {
  try {
    const { index, path, obj } = op

    const slatePath = toSlatePath(path).slice(0, path?.length)

    let node = map[obj]

    try {
      node = getTarget(doc, slatePath)
    } catch (e) {
      console.error(e, slatePath, op, map, toJS(doc))
    }

    if (typeof index !== 'number') return

    const text = node?.text?.[index] || '*'

    if (node) {
      node.text = node?.text
        ? node.text.slice(0, index) + node.text.slice(index + 1)
        : ''
    }

    return {
      type: 'remove_text',
      path: slatePath,
      offset: index,
      text,
      marks: []
    }
  } catch (e) {
    console.error(e, op, map, toJS(doc))
  }
}

const removeNodeOp = (op: Automerge.Diff) => (map: any, doc: Element) => {
  try {
    const { index, obj, path } = op

    const slatePath = toSlatePath(path)

    const parent = getTarget(doc, slatePath)
    const target = parent?.children?.[index as number] ||
      parent?.[index as number] || { children: [] }

    if (!target) {
      throw new TypeError('Target is not found!')
    }

    if (!map.hasOwnProperty(obj)) {
      map[obj] = target
    }

    if (!Number.isInteger(index)) {
      throw new TypeError('Index is not a number')
    }

    if (parent?.children?.[index as number]) {
      parent.children.splice(index, 1)
    } else if (parent?.[index as number]) {
      parent.splice(index, 1)
    }

    return {
      type: 'remove_node',
      path: slatePath.length ? slatePath.concat(index) : [index],
      node: target
    }
  } catch (e) {
    console.error(e, op, map, toJS(doc))
  }
}

const opRemove = (
  op: Automerge.Diff,
  [map, ops]: any,
  doc: any,
  tmpDoc: Element
) => {
  try {
    const { index, path, obj, type } = op

    if (
      map.hasOwnProperty(obj) &&
      typeof map[obj] !== 'string' &&
      type !== 'text' &&
      map?.obj?.length
    ) {
      map[obj].splice(index, 1)

      return [map, ops]
    }

    if (!path) return [map, ops]

    const key = path[path.length - 1]

    if (key === 'cursors' || op.key === 'cursors') return [map, ops]

    const fn = key === 'text' ? removeTextOp : removeNodeOp

    return [map, [...ops, fn(op)(map, tmpDoc)]]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opRemove
