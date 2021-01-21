import Automerge from 'automerge'
import { createServer } from 'http'
import fs from 'fs'
import isEqual from 'lodash/isEqual'
import { createEditor, Node, Transforms } from 'slate'
import { SyncDoc, toJS, toSlateOp } from '@hiveteams/collab-bridge'
import AutomergeCollaboration from '@hiveteams/collab-backend/lib/AutomergeCollaboration'
import withIOCollaboration from './withIOCollaboration'
import { AutomergeOptions, SocketIOPluginOptions } from './interfaces'

const connectionSlug = 'test'
const docId = `/${connectionSlug}`
const options: AutomergeOptions & SocketIOPluginOptions = {
  docId,
  onError: msg => console.log('Encountered test error', msg),
  url: `http://localhost:5000/${connectionSlug}`,
  connectOpts: {
    query: {
      name: 'test-user',
      slug: connectionSlug
    },
    forceNew: true
  }
}

const waitForCondition = (condition: () => boolean, ms = 10) =>
  new Promise<void>(resolve => {
    const handle = setInterval(() => {
      if (condition()) {
        clearInterval(handle)
        resolve()
      }
    }, ms)
  })

const server = createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.write('Hello World!')
  res.end()
})

const defaultSlateJson = [{ type: 'paragraph', children: [{ text: '' }] }]
const collabBackend = new AutomergeCollaboration({
  entry: server,
  defaultValue: defaultSlateJson,
  saveFrequency: 1000,
  async onAuthRequest(query) {
    return { _id: 'test-id', name: 'Eric' }
  },
  async onDocumentLoad(pathname) {
    return defaultSlateJson
  }
})

describe('automerge editor client tests', () => {
  beforeAll(done => {
    //pass a callback to tell jest it is async
    //start the server before any test
    server.listen(5000, () => done())
  })

  const createCollabEditor = async (
    editorOptions?: Partial<AutomergeOptions> & Partial<SocketIOPluginOptions>
  ) => {
    // Given a docId we an generate the collab url
    if (editorOptions?.docId) {
      editorOptions.url = `http://localhost:5000${editorOptions?.docId}`
    }

    const editor = withIOCollaboration(createEditor(), {
      ...options,
      ...editorOptions
    })

    const oldReceiveDocument = editor.receiveDocument
    const promise = new Promise<void>(resolve => {
      editor.receiveDocument = data => {
        oldReceiveDocument(data)
        resolve()
      }
    })
    editor.connect()

    await promise
    return editor
  }

  it('should receiveDocument', async () => {
    const editor = await createCollabEditor()
    expect(editor.children.length).toEqual(1)
    editor.destroy()
  })

  it('should send client update to server', async () => {
    const editor = await createCollabEditor()

    editor.insertNode({ type: 'paragraph', children: [{ text: 'hi' }] })

    await waitForCondition(() => {
      const serverDoc = toJS(collabBackend.backend.getDocument(docId))
      return serverDoc.children.length === 2
    })

    editor.destroy()
  })

  it('should sync updates across two clients', async () => {
    const editor1 = await createCollabEditor()
    const editor2 = await createCollabEditor()

    editor1.insertNode({ type: 'paragraph', children: [{ text: 'hi' }] })

    await waitForCondition(() => {
      const serverDoc = toJS(collabBackend.backend.getDocument(docId))
      return serverDoc.children.length === 2 && editor2.children.length === 2
    })

    editor1.destroy()
    editor2.destroy()
  })

  it('should sync offline changes on reconnect', async () => {
    const editor1 = await createCollabEditor()
    const editor2 = await createCollabEditor()

    editor1.insertNode({ type: 'paragraph', children: [{ text: 'hi' }] })

    await waitForCondition(() => {
      const serverDoc = toJS(collabBackend.backend.getDocument(docId))
      return serverDoc.children.length === 2 && editor2.children.length === 2
    })

    editor1.destroy()

    editor1.insertNode({ type: 'paragraph', children: [{ text: 'offline' }] })

    editor1.connect()

    await waitForCondition(() => {
      const serverDoc = toJS(collabBackend.backend.getDocument(docId))
      return serverDoc.children.length === 3 && editor2.children.length === 3
    })

    expect(Node.string(editor2.children[2])).toEqual('offline')

    editor1.destroy()
    editor2.destroy()
  })

  it('should work with concurrent edits', async () => {
    const editor1 = await createCollabEditor()
    const editor2 = await createCollabEditor()

    const numEdits = 10
    for (let i = 0; i < numEdits; i++) {
      editor1.insertNode({ type: 'paragraph', children: [{ text: '' }] })
      editor2.insertNode({ type: 'paragraph', children: [{ text: '' }] })
    }

    await waitForCondition(() => {
      return (
        editor1.children.length === numEdits * 2 + 1 &&
        editor2.children.length === numEdits * 2 + 1
      )
    })

    expect(isEqual(editor1.children, editor2.children)).toBeTruthy()

    editor1.destroy()
    editor2.destroy()
  })

  it('should work with concurrent insert text operations', async () => {
    const editor1 = await createCollabEditor()
    const editor2 = await createCollabEditor()

    Transforms.select(editor1, [0, 0])
    Transforms.select(editor2, [0, 0])

    const numEdits = 10
    for (let i = 0; i < numEdits; i++) {
      editor1.insertText('a')
      editor2.insertText('b')
    }

    await waitForCondition(() => {
      return (
        Node.string(editor1.children[0]).length === numEdits * 2 &&
        Node.string(editor2.children[0]).length === numEdits * 2
      )
    })

    expect(isEqual(editor1.children, editor2.children)).toBeTruthy()

    editor1.destroy()
    editor2.destroy()
  })

  it('should not throw deep nested tree error', () => {
    // Read from our test json file for the deep tree error
    // This allows us to easily reproduce real production errors
    // and create test cases that resolve those errors
    const rawData = fs.readFileSync(
      `${__dirname}/test-json/deep-tree.json`,
      'utf-8'
    )
    const parsedData = JSON.parse(rawData)
    const { current, operations } = parsedData
    const currentDoc = Automerge.load<SyncDoc>(current)

    // ensure no errors throw when removing a deep tree node
    // that has already been removed
    toSlateOp(operations, currentDoc)
  })

  it('should update children for a root level children operation', async () => {
    const editor = await createCollabEditor()

    const oldDoc = collabBackend.backend.documentSetMap[docId].getDoc(docId)
    const newDoc = Automerge.change(oldDoc, changed => {
      // @ts-ignore
      changed.children = [
        { type: 'paragraph', children: [{ text: 'new' }] },
        { type: 'paragraph', children: [{ text: 'nodes' }] }
      ]
    })
    collabBackend.backend.documentSetMap[docId].setDoc(docId, newDoc)

    await waitForCondition(() => editor.children.length === 2)

    expect(editor.children.length).toEqual(2)
    expect(Node.string(editor.children[0])).toEqual('new')
    expect(Node.string(editor.children[1])).toEqual('nodes')
  })

  afterAll(() => {
    collabBackend.destroy()
    server.close()
  })
})
