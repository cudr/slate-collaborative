import * as Automerge from 'automerge'
import { toSlatePath, toJS } from '../utils/index'
import { getTarget } from '../path'

const removeTextOp = ({ index, path }: Automerge.Diff) => () => ({
  type: 'remove_text',
  path: toSlatePath(path).slice(0, path.length),
  offset: index,
  text: '*',
  marks: []
})

const removeMarkOp = ({ path, index }: Automerge.Diff) => (map, doc) => {
  const slatePath = toSlatePath(path)
  const target = getTarget(doc, slatePath)

  return {
    type: 'remove_mark',
    path: slatePath,
    mark: {
      type: target.marks[index].type
    }
  }
}

const removeNodesOp = ({ index, obj, path }: Automerge.Diff) => (map, doc) => {
  const slatePath = toSlatePath(path)
  if (!map.hasOwnProperty(obj)) {
    const target = getTarget(doc, [...slatePath, index] as any)

    map[obj] = target
  }

  return {
    type: 'remove_node',
    path: slatePath.length ? slatePath.concat(index) : [index],
    node: {
      object: 'text'
    }
  }
}

const removeAnnotationOp = ({ key }: Automerge.Diff) => (map, doc) => {
  return {
    type: 'remove_annotation',
    annotation: toJS(doc.annotations[key])
  }
}

const removeByType = {
  text: removeTextOp,
  nodes: removeNodesOp,
  marks: removeMarkOp,
  annotations: removeAnnotationOp
}

const opRemove = (op: Automerge.Diff, [map, ops]) => {
  try {
    const { index, path, obj } = op

    if (map.hasOwnProperty(obj) && op.type !== 'text') {
      map[obj].splice(index, 1)

      return [map, ops]
    }

    if (!path) return [map, ops]

    const fn = removeByType[path[path.length - 1]]

    return [map, [...ops, fn(op)]]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opRemove
