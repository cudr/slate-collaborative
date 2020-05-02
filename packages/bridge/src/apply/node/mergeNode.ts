import { MergeNodeOperation } from 'slate'

import { SyncDoc } from '../../model'
import { getParent } from '../../path'
import { toJS, cloneNode } from '../../utils'

const mergeNode = (doc: SyncDoc, op: MergeNodeOperation): SyncDoc => {
  const [parent, index]: [any, number] = getParent(doc, op.path)

  const prev = parent[index - 1] || parent.children[index - 1]
  const next = parent[index] || parent.children[index]

  if (prev.text) {
    prev.text.insertAt(prev.text.length, ...toJS(next.text).split(''))
  } else {
    next.children.forEach((n: any) => prev.children.push(cloneNode(n)))
  }

  parent.children
    ? parent.children.deleteAt(index, 1)
    : parent.deleteAt(index, 1)

  return doc
}

export default mergeNode
