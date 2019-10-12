import * as Automerge from 'automerge'
import { toSlatePath, toJS } from '../utils/index'

const setDataOp = ({ path, value }: Automerge.Diff) => map => ({
  type: 'set_node',
  path: toSlatePath(path),
  properties: {},
  newProperties: {
    data: map[value]
  }
})

const AnnotationSetOp = ({ key, value }: Automerge.Diff) => (map, doc) => {
  if (!doc.annotations) {
    doc.annotations = {}
  }

  let op

  /**
   * Looks like set_annotation option is broken, temporary disabled
   */
  // if (!doc.annotations[key]) {
  op = {
    type: 'add_annotation',
    annotation: map[value]
  }
  // } else {
  //   op = {
  //     type: 'set_annotation',
  //     properties: toJS(doc.annotations[key]),
  //     newProperties: map[value]
  //   }
  // }

  console.log('opSET!!', key, map[value], op)

  return op
}

const setByType = {
  data: setDataOp
}

const opSet = (op: Automerge.Diff, [map, ops]) => {
  const { link, value, path, obj, key } = op
  try {
    const set = setByType[key]

    if (set && path) {
      ops.push(set(op))
    } else if (map[obj]) {
      map[obj][key] = link ? map[value] : value
    }

    /**
     * Annotation
     */
    if (path && path.length === 1 && path[0] === 'annotations') {
      ops.push(AnnotationSetOp(op))
    }

    return [map, ops]
  } catch (e) {
    console.error(e, op, toJS(map))

    return [map, ops]
  }
}

export default opSet
