import { InsertTextOperation, RemoveTextOperation } from 'slate'

import { getTarget } from '../path'
import { SyncValue } from '../model'

export const insertText = (
  doc: SyncValue,
  op: InsertTextOperation
): SyncValue => {
  const node = getTarget(doc, op.path)

  node.text.insertAt(op.offset, ...op.text.split(''))

  return doc
}

export const removeText = (
  doc: SyncValue,
  op: RemoveTextOperation
): SyncValue => {
  const node = getTarget(doc, op.path)

  node.text.deleteAt(op.offset, op.text.length)

  return doc
}

export default {
  insert_text: insertText,
  remove_text: removeText
}
