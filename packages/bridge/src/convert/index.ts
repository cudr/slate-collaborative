import opInsert from './insert'
import opRemove from './remove'
import opSet from './set'
import opCreate from './create'

const byAction = {
  create: opCreate,
  remove: opRemove,
  set: opSet,
  insert: opInsert
}

const rootKey = '00000000-0000-0000-0000-000000000000'

const toSlateOp = ops => {
  const iterate = (acc, op) => {
    const action = byAction[op.action]

    const result = action ? action(op, acc) : acc

    return result
  }

  const [tree, defer] = ops.reduce(iterate, [
    {
      [rootKey]: {}
    },
    []
  ])

  return defer.map(op => op(tree))
}

export { toSlateOp }
