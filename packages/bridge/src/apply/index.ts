import { Operation } from 'slate'

import node from './node'
import text from './text'

import { SyncDoc } from '../model'
import { toJS } from '../utils'

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
    console.error(e, op, toJS(doc))

    return doc
  }
}

const applySlateOps = (doc: SyncDoc, operations: Operation[]): SyncDoc => {
  return operations.reduce(applyOperation, doc)
}

export { applyOperation, applySlateOps }
