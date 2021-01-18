import * as Automerge from 'automerge'

import { toSlatePath, toJS } from '../utils'

const setDataOp = (
  { key = '', obj, path, value }: Automerge.Diff,
  doc: any
) => (map: any) => {
  return {
    type: 'set_node',
    path: toSlatePath(path),
    properties: {
      [key]: toJS(Automerge.getObjectById(doc, obj)?.[key])
    },
    newProperties: {
      [key]: map?.[value] || value
    }
  }
}

const opSet = (op: Automerge.Diff, [map, ops]: any, doc: any) => {
  const { link, value, path, obj, key } = op

  try {
    if (path && path.length && path[0] !== 'cursors') {
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
