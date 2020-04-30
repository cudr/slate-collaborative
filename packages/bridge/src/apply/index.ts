import { Operation, Editor } from 'slate'

import node from './node'
import text from './text'

const setSelection = (doc: any) => doc

const opType = {
  ...text,
  ...node,
  set_selection: setSelection
}

const applyOperation = (doc: Editor, op: Operation): Editor => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) {
      console.log('operation', op)
      throw new TypeError(`Unsupported operation type: ${op.type}!`)
    }

    return applyOp(doc, op as any)
  } catch (e) {
    console.error(e)

    return doc
  }
}

const applySlateOps = (doc: Editor, operations: Operation[]) =>
  operations.reduce(applyOperation, doc)

export { applyOperation, applySlateOps }
