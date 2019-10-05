import io from 'socket.io'
import { ValueJSON } from 'slate'
import * as Automerge from 'automerge'
import throttle from 'lodash/throttle'

import { toSync, toJS } from '@slate-collaborative/bridge'

import { getClients, defaultValue, defaultOptions } from './utils'
import { ConnectionOptions } from './model'

class Connection {
  private io: any
  private docSet: any
  private connections: { [key: string]: Automerge.Connection<any> }
  private options: ConnectionOptions

  constructor(options: ConnectionOptions = defaultOptions) {
    this.io = io(options.port, options.connectOpts)
    this.docSet = new Automerge.DocSet()
    this.connections = {}
    this.options = options

    this.configure()
  }

  private configure = () =>
    this.io
      .of(this.nspMiddleware)
      .use(this.authMiddleware)
      .on('connect', this.onConnect)

  private appendDoc = (path: string, value: ValueJSON) => {
    const sync = toSync(value)

    const doc = Automerge.from(sync)

    this.docSet.setDoc(path, doc)
  }

  private saveDoc = throttle(pathname => {
    if (this.options.onDocumentSave) {
      const doc = this.docSet.getDoc(pathname)

      this.options.onDocumentSave(pathname, toJS(doc))
    }
  }, (this.options && this.options.saveTreshold) || 2000)

  private nspMiddleware = async (path, query, next) => {
    const { onDocumentLoad } = this.options

    if (!this.docSet.getDoc(path)) {
      const valueJson = onDocumentLoad
        ? await onDocumentLoad(path)
        : this.options.defaultValue || defaultValue

      if (!valueJson) return next(null, false)

      this.appendDoc(path, valueJson)
    }

    return next(null, true)
  }

  private authMiddleware = async (socket, next) => {
    const { query } = socket.handshake
    const { onAuthRequest } = this.options

    if (onAuthRequest) {
      const permit = await onAuthRequest(query, socket)

      if (!permit)
        return next(new Error(`Authentification error: ${socket.id}`))
    }

    return next()
  }

  private onConnect = socket => {
    const { id, conn } = socket
    const { name } = socket.nsp

    const doc = this.docSet.getDoc(name)

    const data = Automerge.save(doc)

    this.connections[id] = new Automerge.Connection(this.docSet, data => {
      socket.emit('operation', { id: conn.id, ...data })
    })

    socket.join(id, () => {
      this.connections[id].open()

      socket.emit('document', data)
    })

    socket.on('operation', this.onOperation(id, name))

    socket.on('disconnect', this.onDisconnect(id, socket))
  }

  private onOperation = (id, name) => data => {
    try {
      this.connections[id].receiveMsg(data)

      this.saveDoc(name)
    } catch (e) {
      console.log(e)
    }
  }

  private onDisconnect = (id, socket) => () => {
    this.connections[id].close()
    delete this.connections[id]

    socket.leave(id)

    this.garbageNsp()
  }

  garbageNsp = () => {
    Object.keys(this.io.nsps)
      .filter(n => n !== '/')
      .forEach(nsp => {
        getClients(this.io, nsp).then((clientsList: any[]) => {
          if (!clientsList.length) this.removeDoc(nsp)
        })
      })
  }

  removeDoc = async nsp => {
    const doc = this.docSet.getDoc(nsp)

    if (this.options.onDocumentSave) {
      await this.options.onDocumentSave(nsp, toJS(doc))
    }

    this.docSet.removeDoc(nsp)

    delete this.io.nsps[nsp]
  }

  destroy = async () => {
    this.io.close()
  }
}

export default Connection
