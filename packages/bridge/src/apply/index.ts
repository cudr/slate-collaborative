import { Operation } from 'slate'

import node from './node'
import text from './text'

import { SyncValue } from '../model'
import { toJS } from '../utils'

const setSelection = (doc: SyncValue) => doc

const opType = {
  ...text,
  ...node,
  set_selection: setSelection
}

const applyOperation = (doc: SyncValue, op: Operation): SyncValue => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) {
      throw new TypeError(`Unsupported operation type: ${op.type}!`)
    }

    return applyOp(doc, op as any)
  } catch (e) {
    console.error(e, op, toJS(doc))

    return doc
  }
}

const applySlateOps = (doc: SyncValue, operations: Operation[]): SyncValue => {
  return operations.reduce(applyOperation, doc)
}

export { applyOperation, applySlateOps }
