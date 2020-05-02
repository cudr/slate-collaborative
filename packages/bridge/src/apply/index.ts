import { Operation } from 'slate'

import node from './node'
import text from './text'

import { SyncDoc } from '../model'

const setSelection = (doc: any) => doc

const opType = {
  ...text,
  ...node,
  set_selection: setSelection
}

const applyOperation = (doc: SyncDoc, op: Operation): SyncDoc => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) {
      throw new TypeError(`Unsupported operation type: ${op.type}!`)
    }

    return applyOp(doc, op as any)
  } catch (e) {
    console.error(e)

    return doc
  }
}

const applySlateOps = (doc: SyncDoc, operations: Operation[]): SyncDoc =>
  operations.reduce(applyOperation, doc)

export { applyOperation, applySlateOps }
