import { Operation, Operations, SyncDoc } from '../model'

import node from './node'
import mark from './mark'
import text from './text'
import selection from './selection'
import annotation from './annotation'

const setSelection = doc => doc
const setValue = doc => doc

const opType: any = {
  ...text,
  ...annotation,
  ...node,
  ...mark,
  ...selection
  // set_value: setValue
}

export const applyOperation = meta => (
  doc: SyncDoc,
  op: Operation
): SyncDoc => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) throw new TypeError('Unsupported operation type!')

    return applyOp(doc, op, meta)
  } catch (e) {
    console.error(e)

    return doc
  }
}

export const applySlateOps = (doc: SyncDoc, operations: Operations, meta) =>
  operations.reduce(applyOperation(meta), doc)
