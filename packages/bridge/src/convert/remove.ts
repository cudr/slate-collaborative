import * as Automerge from 'automerge'

import { toSlatePath, toJS } from '../utils'
import { getTarget } from '../path'

const removeTextOp = ({ index, path, obj, key }: Automerge.Diff) => (
  map: any,
  doc: any
) => {
  const slatePath = toSlatePath(path).slice(0, path?.length)
  const node = getTarget(doc, slatePath)

  console.log('text', map, obj, key, node, index, node?.text[index as any])

  const text = node?.text[index as any]

  node.text =
    node.text?.slice(0, index) + node.text?.slice((index as number) + 1)

  console.log('node.text', node.text)

  return {
    type: 'remove_text',
    path: slatePath,
    offset: index,
    text: text || '*',
    marks: []
  }
}

const removeNodeOp = ({ index, obj, path }: Automerge.Diff) => (
  map: any,
  doc: any
) => {
  const slatePath = toSlatePath(path)
  if (!map.hasOwnProperty(obj)) {
    const target = getTarget(doc, [...slatePath, index] as any)

    map[obj] = target
  }

  console.log('map[obj]', getTarget(doc, [...slatePath, index] as any))

  return {
    type: 'remove_node',
    path: slatePath.length ? slatePath.concat(index) : [index],
    node: getTarget(doc, [...slatePath, index] as any)
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
