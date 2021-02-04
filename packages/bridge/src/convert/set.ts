import * as Automerge from 'automerge'
import { Element, Node } from 'slate'

import { toSlatePath, toJS } from '../utils'

const setDataOp = (
  { key = '', obj, path, value }: Automerge.Diff,
  doc: any
) => (map: any, tmpDoc: Element) => {
  const slatePath = toSlatePath(path)
  const node = Node.get(tmpDoc, slatePath)
  node[key] = toJS(map?.[value] || value)
  return {
    type: 'set_node',
    path: slatePath,
    properties: {
      [key]: toJS(Automerge.getObjectById(doc, obj)?.[key])
    },
    newProperties: {
      [key]: toJS(node[key])
    }
  }
}

const opSet = (op: Automerge.Diff, [map, ops]: any, doc: any, tmpDoc: any) => {
  const { link, value, path, obj, key } = op

  try {
    if (path && path.length && path[0] !== 'cursors') {
      ops.push(setDataOp(op, doc)(map, tmpDoc))
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
