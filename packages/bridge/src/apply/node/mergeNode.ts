import { MergeNodeOperation, Node } from 'slate'

import { SyncDoc } from '../../model'
import { getParent, getChildren } from '../../path'
import { toJS, cloneNode } from '../../utils'

const mergeNode = (doc: SyncDoc, op: MergeNodeOperation): SyncDoc => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const prev = parent[index - 1] || parent.children[index - 1]
  const next = parent[index] || parent.children[index]

  if (prev.text) {
    prev.text.insertAt(prev.text.length, ...toJS(next.text).split(''))
  } else {
    getChildren(next).forEach((n: Node) => getChildren(prev).push(cloneNode(n)))
  }

  getChildren(parent).deleteAt(index, 1)

  return doc
}

export default mergeNode
