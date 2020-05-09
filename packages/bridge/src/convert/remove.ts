import * as Automerge from 'automerge'

import { toSlatePath, toJS } from '../utils'
import { getTarget } from '../path'

const removeTextOp = ({ index, path }: Automerge.Diff) => () => ({
  type: 'remove_text',
  path: toSlatePath(path).slice(0, path?.length),
  offset: index,
  text: '*',
  marks: []
})

const removeNodeOp = ({ index, obj, path }: Automerge.Diff) => (
  map: any,
  doc: any
) => {
  const slatePath = toSlatePath(path)
  if (!map.hasOwnProperty(obj)) {
    const target = getTarget(doc, [...slatePath, index] as any)

    map[obj] = target
  }

  return {
    type: 'remove_node',
    path: slatePath.length ? slatePath.concat(index) : [index],
    node: {
      text: '*'
    }
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
