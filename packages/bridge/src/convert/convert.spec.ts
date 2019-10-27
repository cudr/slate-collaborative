import * as Automerge from 'automerge'
import { toSlateOp } from './index'
import { createDoc, cloneDoc, createBlockJSON, toJS } from '../utils'

describe('convert operations to slatejs model', () => {
  it('convert insert operations', () => {
    const doc1 = createDoc()
    const doc2 = cloneDoc(doc1)

    const change = Automerge.change(doc1, 'change', (d: any) => {
      d.document.nodes.push(createBlockJSON('paragraph', 'hello!'))
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

  it('convert remove operations', () => {
    const doc1 = Automerge.change(createDoc(), 'change', (d: any) => {
      d.document.nodes.push(createBlockJSON('paragraph', 'hello!'))
      d.document.nodes.push(createBlockJSON('paragraph', 'hello twice!'))
      d.document.nodes[1].nodes[0].text = 'hello!'
    })

    const doc2 = cloneDoc(doc1)

    const change = Automerge.change(doc1, 'change', (d: any) => {
      delete d.document.nodes[1]
      delete d.document.nodes[0].nodes[0]
    })

    const operations = Automerge.diff(doc2, change)

    const slateOps = toSlateOp(operations, change)

    const expectedOps = [
      {
        type: 'remove_node',
        path: [1],
        node: {
          object: 'text'
        }
      },
      {
        type: 'remove_node',
        path: [0, 0],
        node: {
          object: 'text'
        }
      }
    ]

    expect(slateOps).toStrictEqual(expectedOps)
  })
})
