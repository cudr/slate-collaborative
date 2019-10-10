import { Operation, Operations, SyncDoc } from '../model'

import node from './node'
import mark from './mark'
import text from './text'
import annotation from './annotation'

const setSelection = (doc, op, { id, selection }) => {
  console.log('selection', selection.toJSON())
  if (!doc.cursors) {
    doc.cursors = {}
  }

  // console.log('setSelection', op.toJSON(), id)
  const operation = op.toJSON()

  if (!doc.cursors[id]) {
    doc.cursors[id] = {
      key: id,
      type: 'collaborative_selection'
    }
  }

  const cursor = doc.cursors[id]
  const { focus, anchor } = operation.newProperties

  if (focus) cursor.focus = focus
  if (anchor) cursor.anchor = anchor

  return doc
}

const setValue = (doc, op) => doc

const opType: any = {
  ...text,
  ...annotation,
  ...node,
  ...mark,

  set_selection: setSelection,
  set_value: setValue
}

export const applyOperation = meta => (
  doc: SyncDoc,
  op: Operation
): SyncDoc => {
  try {
    const applyOp = opType[op.type]

    if (!applyOp) throw new TypeError('Invalid operation type!')

    return applyOp(doc, op, meta)
  } catch (e) {
    console.error(e)

    return doc
  }
}

export const applySlateOps = (doc: SyncDoc, operations: Operations, meta) =>
  operations.reduce(applyOperation(meta), doc)
