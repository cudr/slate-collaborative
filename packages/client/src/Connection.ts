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
  selection: any
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

    console.log('current doc before updates', toJS(currentDoc))
    console.log('new doc with remote updates!!', toJS(docNew))

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

        await Promise.resolve()

        this.editor.remote = false

        this.setCursors(docNew.cursors)
      }
    } catch (e) {
      console.error(e)
    }
  }

  setCursors = cursors => {
    if (!cursors) return

    // const {
    //   value: { annotations }
    // } = this.editor

    // const keyMap = {}

    // console.log('cursors', cursors)

    // this.editor.withoutSaving(() => {
    //   annotations.forEach(anno => {
    //     this.editor.removeAnnotation(anno)
    //   })

    //   Object.keys(cursors).forEach(key => {
    //     if (key !== this.socket.id && !keyMap[key]) {
    //       this.editor.addAnnotation(toJS(cursors[key]))
    //     }
    //   })
    // })

    console.log(
      '!!!!VAL',
      this.connectOpts.query.name,
      this.editor.value.toJSON({ preserveAnnotations: true })
    )
  }

  receiveSlateOps = (operations: Immutable.List<Operation>) => {
    const doc = this.docSet.getDoc(this.docId)
    const message = `change from ${this.socket.id}`

    if (!doc) return

    const {
      value: { selection }
    } = this.editor

    const annotationType = 'collaborative_selection'

    const cursorData = {
      id: this.socket.id,
      selection,
      // selectionOps: operations.filter(op => op.type === 'set_selection'),
      annotationType
    }

    const withCursor = selection.isFocused ? setCursor : removeCursor

    const changed = Automerge.change(doc, message, (d: any) =>
      withCursor(
        applySlateOps(d, cursorOpFilter(operations, annotationType)),
        cursorData
      )
    )

    console.log('doc with annotations!!', toJS(changed))

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
