import * as Automerge from 'automerge'
import { toSlateOp } from './index'
import { createDoc, cloneDoc, createNode } from '../utils'

describe('convert operations to slatejs model', () => {
  it('convert insert operations', () => {
    const doc1 = createDoc()
    const doc2 = cloneDoc(doc1)

    const change = Automerge.change(doc1, d => {
      d.children.push(createNode('paragraph', 'hello!'))
      d.children[1].children[0].text = 'hello!'
    })

    const operations = Automerge.diff(doc2, change)

    const slateOps = toSlateOp(operations, change)

    const expectedOps = [
      {
        type: 'insert_node',
        path: [1],
        node: { type: 'paragraph', children: [] }
      },
      {
        type: 'insert_node',
        path: [1, 0],
        node: { text: 'hello!' }
      }
    ]

    expect(slateOps).toStrictEqual(expectedOps)
  })

  it('convert remove operations', () => {
    const doc1 = Automerge.change(createDoc(), d => {
      d.children.push(createNode('paragraph', 'hello!'))
      d.children.push(createNode('paragraph', 'hello twice!'))
      d.children[1].children[0].text = 'hello!'
    })

    const doc2 = cloneDoc(doc1)

    const change = Automerge.change(doc1, d => {
      delete d.children[1]
      delete d.children[0].children[0]
    })

    const operations = Automerge.diff(doc2, change)

    const slateOps = toSlateOp(operations, change)

    const expectedOps = [
      {
        type: 'remove_node',
        path: [1],
        node: createNode('paragraph', 'hello twice!')
      },
      {
        type: 'remove_node',
        path: [0, 0],
        node: {
          children: []
        }
      }
    ]

    expect(slateOps).toStrictEqual(expectedOps)
  })
})
