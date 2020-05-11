import * as Automerge from 'automerge'

import opInsert from './insert'
import opRemove from './remove'
import opSet from './set'
import opCreate from './create'

import { SyncDoc } from '../model'

const byAction = {
  create: opCreate,
  remove: opRemove,
  set: opSet,
  insert: opInsert
}

const rootKey = '00000000-0000-0000-0000-000000000000'

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

  return defer.flatMap(op => op(tempTree, doc)).filter(op => op)
}

export { toSlateOp }
