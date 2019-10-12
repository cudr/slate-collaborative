import { Operation, Operations, SyncDoc } from '../model'

import node from './node'
import mark from './mark'
import text from './text'
import annotation from './annotation'

const setSelection = doc => doc
const setValue = doc => doc

const opType: any = {
  ...text,
  ...annotation,
  ...node,
  ...mark,
  set_selection: setSelection
  // set_value: setValue
}

export const applyOperation = (doc: SyncDoc, op: Operation): SyncDoc => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) throw new TypeError('Unsupported operation type!')

    return applyOp(doc, op)
  } catch (e) {
    console.error(e)

    return doc
  }
}

export const applySlateOps = (doc: SyncDoc, operations: Operations) =>
  operations.reduce(applyOperation, doc)
