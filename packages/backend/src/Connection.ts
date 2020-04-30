import io from 'socket.io'
import * as Automerge from 'automerge'
import throttle from 'lodash/throttle'
import merge from 'lodash/merge'

import { toSync, toJS } from '@slate-collaborative/bridge'

import { getClients, defaultValue, defaultOptions } from './utils'
import { ConnectionOptions } from './model'

export default class Connection {
  private io: any
  private docSet: any
  private connections: { [key: string]: Automerge.Connection<any> }
  private options: ConnectionOptions

  constructor(options: ConnectionOptions = defaultOptions) {
    this.io = io(options.entry, options.connectOpts)
    this.docSet = new Automerge.DocSet()
    this.connections = {}
    this.options = merge(defaultOptions, options)

    this.configure()

    return this
  }

  private configure = () =>
    this.io
      .of(this.nspMiddleware)
      .use(this.authMiddleware)
      .on('connect', this.onConnect)

  private appendDoc = (path: string, value: any) => {
    const sync = toSync({ cursors: {}, children: value })

    const doc = Automerge.from(sync)

    this.docSet.setDoc(path, doc)
  }

  private saveDoc = throttle(pathname => {
    try {
      if (this.options.onDocumentSave) {
        const doc = this.docSet.getDoc(pathname)

        if (doc) {
          const data = toJS(doc)

          this.options.onDocumentSave(pathname, data.children)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }, (this.options && this.options.saveTreshold) || 2000)

  private nspMiddleware = async (path: string, query: any, next: any) => {
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

  private authMiddleware = async (socket: any, next: any) => {
    const { query } = socket.handshake
    const { onAuthRequest } = this.options

    if (onAuthRequest) {
      const permit = await onAuthRequest(query, socket)

      if (!permit)
        return next(new Error(`Authentification error: ${socket.id}`))
    }

    return next()
  }

  private onConnect = (socket: any) => {
    const { id, conn } = socket
    const { name } = socket.nsp

    this.connections[id] = new Automerge.Connection(this.docSet, payload => {
      socket.emit('msg', {
        type: 'operation',
        payload: { id: conn.id, ...payload }
      })
    })

    socket.join(id, () => {
      const doc = this.docSet.getDoc(name)

      socket.emit('msg', { type: 'document', payload: Automerge.save(doc) })

      this.connections[id].open()
    })

    socket.on('msg', this.onMessage(id, name))

    socket.on('disconnect', this.onDisconnect(id, socket))

    this.garbageCursors(name)
  }

  private onMessage = (id: any, name: any) => (data: any) => {
    switch (data.type) {
      case 'operation':
        try {
          this.connections[id].receiveMsg(data.payload)

          this.saveDoc(name)

          this.garbageCursors(name)
        } catch (e) {
          console.log(e)
        }
    }
  }

  private onDisconnect = (id: any, socket: any) => () => {
    this.connections[id].close()
    delete this.connections[id]

    socket.leave(id)

    this.garbageCursor(socket.nsp.name, id)
    this.garbageCursors(socket.nsp.name)

    this.garbageNsp()
  }

  garbageNsp = () => {
    Object.keys(this.io.nsps)
      .filter(n => n !== '/')
      .forEach(nsp => {
        getClients(this.io, nsp).then((clientsList: any) => {
          if (!clientsList.length) this.removeDoc(nsp)
        })
      })
  }

  garbageCursor = (nsp: string, id: string) => {
    const doc = this.docSet.getDoc(nsp)

    if (!doc.cursors) return

    const change = Automerge.change(doc, (d: any) => {
      delete d.cursors[id]
    })

    this.docSet.setDoc(nsp, change)
  }

  garbageCursors = (nsp: string) => {
    const doc = this.docSet.getDoc(nsp)

    if (!doc.cursors) return

    const namespace = this.io.of(nsp)

    Object.keys(doc.cursors).forEach(key => {
      if (!namespace.sockets[key]) {
        this.garbageCursor(nsp, key)
      }
    })
  }

  removeDoc = async (nsp: string) => {
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
