import { SyncDoc } from '../model'
import { InsertTextOperation, RemoveTextOperation } from 'slate'
import { getTarget } from '../path'

export const insertText = (doc: SyncDoc, op: InsertTextOperation): SyncDoc => {
  const node = getTarget(doc, op.path)

  node.text.insertAt(op.offset, op.text)

  return doc
}

export const removeText = (doc: SyncDoc, op: RemoveTextOperation): SyncDoc => {
  const node = getTarget(doc, op.path)

  node.text.deleteAt(op.offset, op.text.length)

  return doc
}

export default {
  insert_text: insertText,
  remove_text: removeText
}
