import Automerge from 'automerge'
import Immutable from 'immutable'
import io from 'socket.io-client'

import { Value, Operation } from 'slate'
import { ConnectionModel } from './model'

import { applySlateOps, toSlateOp, toJS } from '@slate-collaborative/bridge'

class Connection {
  url: string
  docId: string
  docSet: Automerge.DocSet<any>
  connection: Automerge.Connection<any>
  socket: SocketIOClient.Socket
  editor: any
  connectOpts: any
  onConnect?: () => void
  onDisconnect?: () => void

  constructor({
    editor,
    url,
    connectOpts,
    onConnect,
    onDisconnect
  }: ConnectionModel) {
    this.url = url
    this.editor = editor
    this.connectOpts = connectOpts
    this.onConnect = onConnect
    this.onDisconnect = onDisconnect

    this.docId = connectOpts.path || new URL(url).pathname

    this.docSet = new Automerge.DocSet()

    this.connect()
  }

  sendData = (data: any) => {
    this.socket.emit('operation', data)
  }

  recieveData = async (data: any) => {
    if (this.docId !== data.docId || !this.connection) {
      return
    }

    const currentDoc = this.docSet.getDoc(this.docId)
    const docNew = this.connection.receiveMsg(data)

    if (!docNew) {
      return
    }

    try {
      const operations = Automerge.diff(currentDoc, docNew)

      if (operations.length !== 0) {
        const slateOps = toSlateOp(operations, currentDoc)

        this.editor.remote = true

        this.editor.withoutSaving(() => {
          slateOps.forEach(o => {
            this.editor.applyOperation(o)
          })
        })

        setTimeout(() => (this.editor.remote = false), 5)
      }
    } catch (e) {
      console.error(e)
    }
  }

  receiveSlateOps = (operations: Immutable.List<Operation>) => {
    const doc = this.docSet.getDoc(this.docId)
    const message = `change from ${this.socket.id}`

    if (!doc) return

    const changed = Automerge.change(doc, message, (d: any) =>
      applySlateOps(d, operations)
    )

    this.docSet.setDoc(this.docId, changed)
  }

  recieveDocument = data => {
    const currentDoc = this.docSet.getDoc(this.docId)

    if (!currentDoc) {
      const doc = Automerge.load(data)

      this.docSet.removeDoc(this.docId)

      this.docSet.setDoc(this.docId, doc)

      this.editor.controller.setValue(Value.fromJSON(toJS(doc)))
    }

    this.editor.setFocus()

    this.connection.open()

    this.onConnect && setTimeout(this.onConnect, 0)
  }

  connect = () => {
    this.socket = io(this.url, this.connectOpts)

    this.socket.on('connect', () => {
      this.connection = new Automerge.Connection(this.docSet, this.sendData)

      this.socket.on('document', this.recieveDocument)

      this.socket.on('operation', this.recieveData)

      this.socket.on('disconnect', this.disconnect)
    })
  }

  disconnect = () => {
    this.onDisconnect()

    this.connection && this.connection.close()

    delete this.connection

    this.socket.removeListener('document')
    this.socket.removeListener('operation')
  }

  close = () => {
    this.onDisconnect()

    this.socket.close()
  }
}

export default Connection
