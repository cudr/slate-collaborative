import * as Automerge from 'automerge'

interface TestDoc {
  _id: string
  status: string
}

// TODO: delete this?
describe('old state error replication', () => {
  const clientDocSet = new Automerge.DocSet()
  const serverDocSet = new Automerge.DocSet()

  const docId = 'test'
  let clientDoc = Automerge.from<TestDoc>({
    _id: docId,
    status: 'Unstarted'
  })
  let serverDoc = Automerge.from<TestDoc>({
    _id: docId,
    status: 'Unstarted'
  })

  it('replicate old state error', () => {
    clientDocSet.setDoc(docId, clientDoc)
    serverDocSet.setDoc(docId, serverDoc)

    let clientMessages: string[] = []
    const clientConnection = new Automerge.Connection(clientDocSet, msg => {
      clientMessages.push(JSON.stringify(msg))
    })
    clientConnection.open()
    let serverMessages: string[] = []
    const serverConnection = new Automerge.Connection(serverDocSet, msg => {
      serverMessages.push(JSON.stringify(msg))
    })
    serverConnection.open()

    let oldClientDoc = clientDoc
    clientDoc = Automerge.change(clientDoc, newClientDoc => {
      newClientDoc.status = 'In progress'
    })
    clientDocSet.setDoc(docId, clientDoc)

    expect(clientMessages.length).toEqual(2)
    expect(serverMessages.length).toEqual(1)

    expect(() => {
      clientDocSet.setDoc(docId, oldClientDoc)
    }).toThrow()
  })
})
