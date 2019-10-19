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

const applyOperation = (doc: SyncDoc, op: Operation): SyncDoc => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) {
      console.log('operation', op.toJS())
      throw new TypeError(`Unsupported operation type: ${op.type}!`)
    }

    return applyOp(doc, op)
  } catch (e) {
    console.error(e)

    return doc
  }
}

const applySlateOps = (doc: SyncDoc, operations: Operations) =>
  operations.reduce(applyOperation, doc)

export { applyOperation, applySlateOps }
