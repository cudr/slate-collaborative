import io from 'socket.io'
import * as Automerge from 'automerge'
import { Node } from 'slate'
import { Server } from 'http'

import throttle from 'lodash/throttle'

import { SyncDoc, CollabAction, toJS } from '@hiveteams/collab-bridge'

import { getClients } from './utils'

import AutomergeBackend from './AutomergeBackend'
import { debugCollabBackend } from 'utils/debug'

export interface SocketIOCollaborationOptions {
  entry: Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue: Node[]
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
  private autoSaveDoc: (id: string, docId: string) => void

  /**
   * Constructor
   */

  constructor(options: SocketIOCollaborationOptions) {
    this.io = io(options.entry, options.connectOpts)

    this.backend = new AutomergeBackend()

    this.options = options

    /**
     * Save document with throttle
     */
    this.autoSaveDoc = throttle(
      async (id: string, docId: string) =>
        this.backend.getDocument(docId) && this.saveDocument(id, docId),
      this.options?.saveFrequency || 2000
    )

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
    return next(null, true)
  }

  /**
   * SocketIO auth middleware. Used for user authentification.
   */

  private authMiddleware = async (
    socket: SocketIO.Socket,
    next: (e?: any) => void
  ) => {
    const { id } = socket
    const { query } = socket.handshake
    const { onAuthRequest } = this.options

    // we connect before any async logic so that we
    // never miss a socket disconnection event
    socket.on('disconnect', this.onDisconnect(id, socket))

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

  private onConnect = async (socket: SocketIO.Socket) => {
    const { id, conn } = socket
    // do nothing if the socket connection has already been closed
    if (conn.readyState === 'closed') {
      return
    }

    const { name } = socket.nsp
    const { onDocumentLoad } = this.options

    if (!this.backend.getDocument(name)) {
      const doc = onDocumentLoad
        ? await onDocumentLoad(name)
        : this.options.defaultValue

      // Ensure socket is still opened
      // recheck ready state after async operation
      if (conn.readyState === 'closed') {
        return
      }

      // recheck backend getDocument after async operation
      if (!this.backend.getDocument(name)) {
        debugCollabBackend('Append document\t\t%s', id)
        this.backend.appendDocument(name, doc)
      }
    }

    debugCollabBackend('Create connection\t%s', id)
    this.backend.createConnection(
      id,
      name,
      ({ type, payload }: CollabAction) => {
        socket.emit('msg', { type, payload: { id: conn.id, ...payload } })
      }
    )

    socket.on('msg', this.onMessage(id, name))

    socket.join(id, () => {
      const doc = this.backend.getDocument(name)

      if (!doc) {
        debugCollabBackend(
          'onConnect: No document available at the time of socket.io join docId=%s socketId=%s',
          name,
          id
        )
        return
      }

      socket.emit('msg', {
        type: 'document',
        payload: Automerge.save<SyncDoc>(doc)
      })

      debugCollabBackend('Open connection\t\t%s', id)
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

          this.autoSaveDoc(id, name)

          this.garbageCursors(name)
        } catch (e) {
          console.log(e)
        }
    }
  }

  /**
   * Save document
   */

  private saveDocument = async (id: string, docId: string) => {
    try {
      const { onDocumentSave } = this.options

      const doc = this.backend.getDocument(docId)

      // Return early if there is no valid document in our crdt backend
      // Note: this will happen when user disconnects from the collab server
      // before document load has completed
      if (!doc) {
        return
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
    debugCollabBackend('Connection closed\t%s', id)
    this.backend.closeConnection(id)

    await this.saveDocument(id, socket.nsp.name)

    // cleanup automerge cursor and socket connection
    this.garbageCursors(socket.nsp.name)

    socket.leave(id)
    this.garbageNsp(id)
  }

  /**
   * Clean up unused SocketIO namespaces.
   */

  garbageNsp = (id: string) => {
    Object.keys(this.io.nsps)
      .filter(n => n !== '/')
      .forEach(nsp => {
        getClients(this.io, nsp).then((clientsList: any) => {
          debugCollabBackend(
            'Garbage namespace\t%s clientsList=%o %s',
            id,
            clientsList,
            nsp
          )
          if (!clientsList.length) {
            debugCollabBackend('Removing document\t%s', id)
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
    // if document has already been cleaned up, it is safe to return early
    if (!doc || !doc.cursors) return

    const namespace = this.io.of(nsp)

    Object.keys(doc?.cursors)?.forEach(key => {
      if (!namespace.sockets[key]) {
        debugCollabBackend('Garbage cursor\t\t%s', key)
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
