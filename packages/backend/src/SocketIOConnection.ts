import io from 'socket.io'
import * as Automerge from 'automerge'
import { Node } from 'slate'
import { Server } from 'http'

import throttle from 'lodash/throttle'

import { SyncDoc, CollabAction, toJS } from '@slate-collaborative/bridge'

import { getClients } from './utils'

import AutomergeBackend from './AutomergeBackend'

export interface SocketIOCollaborationOptions {
  entry: Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: Node[]
  saveFrequency?: number
  onAuthRequest?: (
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad?: (
    pathname: string,
    query?: Object
  ) => Promise<Node[]> | Node[]
  onDocumentSave?: (pathname: string, doc: Node[]) => Promise<void> | void
}

export default class SocketIOCollaboration {
  private io: SocketIO.Server
  private options: SocketIOCollaborationOptions
  private backend: AutomergeBackend

  /**
   * Constructor
   */

  constructor(options: SocketIOCollaborationOptions) {
    this.io = io(options.entry, options.connectOpts)

    this.backend = new AutomergeBackend()

    this.options = options

    this.configure()

    return this
  }

  /**
   * Initial IO configuration
   */

  private configure = () =>
    this.io
      .of(this.nspMiddleware)
      .use(this.authMiddleware)
      .on('connect', this.onConnect)

  /**
   * Namespace SocketIO middleware. Load document value and append it to CollaborationBackend.
   */

  private nspMiddleware = async (path: string, query: any, next: any) => {
    const { onDocumentLoad } = this.options

    if (!this.backend.getDocument(path)) {
      const doc = onDocumentLoad
        ? await onDocumentLoad(path, query)
        : this.options.defaultValue

      if (!doc) return next(null, false)

      this.backend.appendDocument(path, doc)
    }

    return next(null, true)
  }

  /**
   * SocketIO auth middleware. Used for user authentification.
   */

  private authMiddleware = async (
    socket: SocketIO.Socket,
    next: (e?: any) => void
  ) => {
    const { query } = socket.handshake
    const { onAuthRequest } = this.options

    if (onAuthRequest) {
      const permit = await onAuthRequest(query, socket)

      if (!permit)
        return next(new Error(`Authentification error: ${socket.id}`))
    }

    return next()
  }

  /**
   * On 'connect' handler.
   */

  private onConnect = (socket: SocketIO.Socket) => {
    const { id, conn } = socket
    const { name } = socket.nsp

    this.backend.createConnection(id, ({ type, payload }: CollabAction) => {
      socket.emit('msg', { type, payload: { id: conn.id, ...payload } })
    })

    socket.on('msg', this.onMessage(id, name))

    socket.on('disconnect', this.onDisconnect(id, socket))

    socket.join(id, () => {
      const doc = this.backend.getDocument(name)

      socket.emit('msg', {
        type: 'document',
        payload: Automerge.save<SyncDoc>(doc)
      })

      this.backend.openConnection(id)
    })

    this.garbageCursors(name)
  }

  /**
   * On 'message' handler
   */

  private onMessage = (id: string, name: string) => (data: any) => {
    switch (data.type) {
      case 'operation':
        try {
          this.backend.receiveOperation(id, data)

          this.autoSaveDoc(name)

          this.garbageCursors(name)
        } catch (e) {
          console.log(e)
        }
    }
  }

  /**
   * Save document with throttle
   */

  private autoSaveDoc = throttle(
    async (docId: string) =>
      this.saveDocument(docId),
    this.getSaveFrequency()
  )

  /**
   * function to abstract getting the save frequency so the throttle function above ACTUALLY works and compiles.
   */
  private getSaveFrequency(){
    return this.options?.saveFrequency || 2000;
  }

  /**
   * Save document
   */

  private saveDocument = async (docId: string) => {
    try {
      const { onDocumentSave } = this.options

      const doc = this.backend.getDocument(docId)

      if (!doc) {
        throw new Error(`Can't receive document by id: ${docId}`)
      }

      onDocumentSave && (await onDocumentSave(docId, toJS(doc.children)))
    } catch (e) {
      console.error(e, docId)
    }
  }

  /**
   * On 'disconnect' handler
   */

  private onDisconnect = (id: string, socket: SocketIO.Socket) => async () => {
    this.backend.closeConnection(id)

    await this.saveDocument(socket.nsp.name)

    this.garbageCursors(socket.nsp.name)

    socket.leave(id)

    this.garbageNsp()
  }

  /**
   * Clean up unused SocketIO namespaces.
   */

  garbageNsp = () => {
    Object.keys(this.io.nsps)
      .filter(n => n !== '/')
      .forEach(nsp => {
        getClients(this.io, nsp).then((clientsList: any) => {
          if (!clientsList.length) {
            this.backend.removeDocument(nsp)

            delete this.io.nsps[nsp]
          }
        })
      })
  }

  /**
   * Clean up unused cursor data.
   */

  garbageCursors = (nsp: string) => {
    const doc = this.backend.getDocument(nsp)

    if (!doc.cursors) return

    const namespace = this.io.of(nsp)

    Object.keys(doc?.cursors)?.forEach(key => {
      if (!namespace.sockets[key]) {
        this.backend.garbageCursor(nsp, key)
      }
    })
  }

  /**
   * Destroy SocketIO connection
   */

  destroy = async () => {
    this.io.close()
  }
}
