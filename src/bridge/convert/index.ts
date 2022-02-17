import * as Automerge from 'automerge'

import opInsert from './insert'
import opRemove from './remove'
import opSet from './set'
import opCreate from './create'

import { toJS } from '../utils'

import { SyncDoc } from '../model'
import { rootKey } from './constants'

const byAction = {
  create: opCreate,
  remove: opRemove,
  set: opSet,
  insert: opInsert
}

const toSlateOp = (ops: Automerge.Diff[], doc: SyncDoc) => {
  const iterate = (acc: [any, any[]], op: Automerge.Diff): any => {
    const action = byAction[op.action]

    const result = action ? action(op, acc, doc) : acc

    return result
  }

  const [tempTree, defer] = ops.reduce(iterate, [
    {
      [rootKey]: {}
    },
    []
  ])

  const tempDoc = toJS(doc)

  return defer.flatMap(op => op(tempTree, tempDoc)).filter(op => op)
}

export { toSlateOp }
