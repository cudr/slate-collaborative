import { Editor, InsertTextOperation, RemoveTextOperation } from 'slate'

import { getTarget } from '../path'

export const insertText = (doc: Editor, op: InsertTextOperation): Editor => {
  const node = getTarget(doc, op.path)

  node.text.insertAt(op.offset, op.text)

  return doc
}

export const removeText = (doc: Editor, op: RemoveTextOperation): Editor => {
  const node = getTarget(doc, op.path)

  node.text.deleteAt(op.offset, op.text.length)

  return doc
}

export default {
  insert_text: insertText,
  remove_text: removeText
}
