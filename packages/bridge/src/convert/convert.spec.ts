import * as Automerge from 'automerge'
import { toSlateOp } from './index'
import { createDoc, cloneDoc, createParagraphJSON } from '../utils'

describe('convert operations to slatejs model', () => {
  it('convert insert operations', () => {
    const doc1 = createDoc()
    const doc2 = cloneDoc(doc1)

    const change = Automerge.change(doc1, 'change', (d: any) => {
      d.document.nodes.push(createParagraphJSON('hello!'))
      d.document.nodes[1].nodes[0].text = 'hello!'
    })

    const operations = Automerge.diff(doc2, change)

    const slateOps = toSlateOp(operations, change)

    const expectedOps = [
      {
        type: 'insert_node',
        path: [1],
        node: { object: 'block', type: 'paragraph', nodes: [] }
      },
      {
        type: 'insert_node',
        path: [1, 0],
        node: { object: 'text', marks: [], text: 'hello!' }
      }
    ]

    expect(slateOps).toStrictEqual(expectedOps)
  })
})
