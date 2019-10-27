import Automerge from 'automerge'
import Immutable from 'immutable'
import io from 'socket.io-client'

import { Value, Operation } from 'slate'
import { ConnectionModel, ExtendedEditor } from './model'

import {
  setCursor,
  removeCursor,
  cursorOpFilter,
  applySlateOps,
  toSlateOp,
  toJS
} from '@slate-collaborative/bridge'

class Connection {
  url: string
  docId: string
  docSet: Automerge.DocSet<any>
  connection: Automerge.Connection<any>
  socket: SocketIOClient.Socket
  editor: ExtendedEditor
  connectOpts: any
  annotationDataMixin: any
  cursorAnnotationType: string
  onConnect?: () => void
  onDisconnect?: () => void

  constructor({
    editor,
    url,
    connectOpts,
    onConnect,
    onDisconnect,
    cursorAnnotationType,
    annotationDataMixin
  }: ConnectionModel) {
    this.url = url
    this.editor = editor
    this.connectOpts = connectOpts
    this.cursorAnnotationType = cursorAnnotationType
    this.annotationDataMixin = annotationDataMixin

    this.onConnect = onConnect
    this.onDisconnect = onDisconnect

    this.docId = connectOpts.path || new URL(url).pathname

    this.docSet = new Automerge.DocSet()

    this.connect()

    return this
  }

  sendData = (data: any) => {
    this.socket.emit('operation', data)
  }

  recieveData = async (data: any) => {
    if (this.docId !== data.docId || !this.connection) {
      return
    }

    try {
      const currentDoc = this.docSet.getDoc(this.docId)
      const docNew = this.connection.receiveMsg(data)

      if (!docNew) {
        return
      }

      const operations = Automerge.diff(currentDoc, docNew)

      if (operations.length !== 0) {
        const slateOps = toSlateOp(operations, currentDoc)

        this.editor.remote = true

        this.editor.withoutSaving(() => {
          slateOps.forEach(o => {
            this.editor.applyOperation(o)
          })
        })

        await Promise.resolve()

        this.editor.remote = false

        this.garbageCursors()
      }
    } catch (e) {
      console.error(e)
    }
  }

  garbageCursors = async () => {
    const doc = this.docSet.getDoc(this.docId)
    const { value } = this.editor

    if (value.annotations.size === Object.keys(doc.annotations).length) {
      return
    }

    const garbage = []

    value.annotations.forEach(annotation => {
      if (
        annotation.type === this.cursorAnnotationType &&
        !doc.annotations[annotation.key]
      ) {
        garbage.push(annotation)
      }
    })

    if (garbage.length) {
      this.editor.withoutSaving(() => {
        garbage.forEach(annotation => {
          this.editor.removeAnnotation(annotation)
        })
      })
    }
  }

  receiveSlateOps = (operations: Immutable.List<Operation>) => {
    const doc = this.docSet.getDoc(this.docId)
    const message = `change from ${this.socket.id}`

    if (!doc) return

    const {
      value: { selection }
    } = this.editor

    const withCursor = selection.isFocused ? setCursor : removeCursor

    const changed = Automerge.change(doc, message, (d: any) =>
      withCursor(
        applySlateOps(d, cursorOpFilter(operations, this.cursorAnnotationType)),
        this.socket.id,
        selection,
        this.cursorAnnotationType,
        this.annotationDataMixin
      )
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
    this.socket = io(this.url, { ...this.connectOpts })

    this.socket.on('connect', () => {
      this.connection = new Automerge.Connection(this.docSet, this.sendData)

      this.socket.on('document', this.recieveDocument)

      this.socket.on('operation', this.recieveData)

      this.socket.on('disconnect', this.disconnect)
    })
  }

  disconnect = () => {
    this.onDisconnect()

    console.log('disconnect', this.socket)

    this.connection && this.connection.close()

    delete this.connection

    this.socket.removeListener('document')
    this.socket.removeListener('operation')
  }

  close = () => {
    this.onDisconnect()

    this.socket.close()
    // this.socket.destroy()
  }
}

export default Connection
