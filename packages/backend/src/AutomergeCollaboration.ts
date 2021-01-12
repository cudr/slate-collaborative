import io, { Socket } from 'socket.io'
import * as Automerge from 'automerge'
import { Node } from 'slate'
import { Server } from 'http'
import throttle from 'lodash/throttle'
import { SyncDoc, CollabAction, toJS } from '@hiveteams/collab-bridge'
import { getClients } from './utils/index'
import { debugCollabBackend } from './utils/debug'
import AutomergeBackend from './AutomergeBackend'

export interface IAutomergeCollaborationOptions {
  entry: Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue: Node[]
  saveFrequency?: number
  onAuthRequest?: (query: any, socket?: SocketIO.Socket) => Promise<any>
  onDocumentLoad?: (docId: string, query?: any) => Promise<Node[]> | Node[]
  onDocumentSave?: (
    docId: string,
    doc: Node[],
    user: any
  ) => Promise<void> | void
  onDisconnect?: (docId: string, user: any) => Promise<void> | void
  onError?: (error: Error, data: any) => Promise<void> | void
}

export default class AutomergeCollaboration {
  private io: SocketIO.Server
  private options: IAutomergeCollaborationOptions
  public backend: AutomergeBackend
  private userMap: { [key: string]: any | undefined }
  private autoSaveDoc: (socket: SocketIO.Socket, docId: string) => void

  /**
   * Constructor
   */

  constructor(options: IAutomergeCollaborationOptions) {
    this.io = io(options.entry, options.connectOpts)

    this.backend = new AutomergeBackend()

    this.options = options

    this.configure()

    this.userMap = {}

    /**
     * Save document with throttle
     */
    this.autoSaveDoc = throttle(
      async (socket: SocketIO.Socket, docId: string) =>
        this.backend.getDocument(docId) && this.saveDocument(socket, docId),
      this.options?.saveFrequency || 2000
    )

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
   * Construct error data and call onError callback
   */
  private handleError(socket: SocketIO.Socket, err: Error, data: any = {}) {
    const { id } = socket
    const { name: docId } = socket.nsp

    if (this.options.onError) {
      const document = this.backend.getDocument(docId)
      this.options.onError(err, {
        user: this.userMap[id],
        docId,
        automergeDocument: document ? Automerge.save(document) : null,
        ...data
      })
    }
  }

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
    const { query } = socket.handshake
    const { onAuthRequest } = this.options

    // we connect before any async logic so that we
    // never miss a socket disconnection event
    socket.on('disconnect', this.onDisconnect(socket))

    if (onAuthRequest) {
      const user = await onAuthRequest(query, socket)

      if (!user) return next(new Error(`Authentification error: ${socket.id}`))

      this.userMap[socket.id] = user
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

    const { name: docId } = socket.nsp
    const { onDocumentLoad } = this.options

    try {
      // Load document if no document state is already stored in our automerge backend
      if (!this.backend.getDocument(docId)) {
        // If the user provided an onDocumentLoad function use that, otherwise use the
        // default value that was provided in the options
        const doc = onDocumentLoad
          ? await onDocumentLoad(docId)
          : this.options.defaultValue

        // Ensure socket is still opened
        // recheck websocket connection state after the previous potentially async document load
        if (conn.readyState === 'closed') {
          return
        }

        // recheck backend getDocument after async operation
        // to avoid duplicatively loading a document
        if (!this.backend.getDocument(docId)) {
          debugCollabBackend('Append document\t\t%s', id)
          this.backend.appendDocument(docId, doc)
        }
      }

      // Create a new backend connection for this socketId and docId
      debugCollabBackend('Create connection\t%s', id)
      this.backend.createConnection(
        id,
        docId,
        ({ type, payload }: CollabAction) => {
          if (payload.docId === docId) {
            socket.emit('msg', { type, payload: { id: conn.id, ...payload } })
          }
        }
      )

      // Setup the on message callback
      socket.on('msg', this.onMessage(socket, docId))

      const doc = this.backend.getDocument(docId)
      if (!doc) {
        debugCollabBackend(
          'onConnect: No document available at the time of socket.io join docId=%s socketId=%s',
          docId,
          id
        )
        return
      }

      // Emit the socket message needed for receiving the automerge document
      // on connect and reconnect
      socket.emit('msg', {
        type: 'document',
        payload: Automerge.save<SyncDoc>(doc)
      })

      debugCollabBackend('Open connection\t\t%s', id)
      this.backend.openConnection(id)
      this.garbageCursors(socket)
    } catch (err) {
      this.handleError(socket, err)
    }
  }

  /**
   * On 'message' handler
   */

  private onMessage = (socket: SocketIO.Socket, docId: string) => (
    data: any
  ) => {
    const { id } = socket
    switch (data.type) {
      case 'operation':
        try {
          this.backend.receiveOperation(id, data)

          this.autoSaveDoc(socket, docId)

          this.garbageCursors(socket)
        } catch (err) {
          this.handleError(socket, err, { onMessageData: data })
        }
    }
  }

  /**
   * Save document
   */

  private saveDocument = async (socket: SocketIO.Socket, docId: string) => {
    try {
      const { id } = socket
      const { onDocumentSave } = this.options

      const doc = this.backend.getDocument(docId)

      // Return early if there is no valid document in our crdt backend
      // Note: this will happen when user disconnects from the collab server
      // before document load has completed
      if (!doc) {
        return
      }

      const user = this.userMap[id]

      if (onDocumentSave && user) {
        await onDocumentSave(docId, toJS(doc.children), user)
      }
    } catch (err) {
      this.handleError(socket, err)
    }
  }

  /**
   * On 'disconnect' handler
   */

  private onDisconnect = (socket: SocketIO.Socket) => async () => {
    try {
      const { id } = socket
      const { name: docId } = socket.nsp
      socket.leave(docId)

      debugCollabBackend('Connection closed\t%s', id)
      this.backend.closeConnection(id)

      await this.saveDocument(socket, docId)

      // trigger onDisconnect callback if one was provided
      // and if a user has been loaded for this socket connection
      const user = this.userMap[id]
      if (this.options.onDisconnect && user) {
        await this.options.onDisconnect(docId, user)
      }

      // cleanup automerge cursor and socket connection
      this.garbageCursors(socket)
      socket.leave(id)
      this.garbageNsp(socket)

      // cleanup usermap
      delete this.userMap[id]
    } catch (err) {
      this.handleError(socket, err)
    }
  }

  /**
   * Clean up unused SocketIO namespaces.
   */

  garbageNsp = (socket: SocketIO.Socket) => {
    const { name: docId } = socket.nsp
    Object.keys(this.io.nsps)
      .filter(n => n !== '/')
      .forEach(nsp => {
        getClients(this.io, nsp)
          .then((clientsList: any) => {
            if (!clientsList.length) {
              debugCollabBackend('Removing document\t%s', docId)
              this.backend.removeDocument(nsp)
              delete this.io.nsps[nsp]
            }
          })
          .catch(err => {
            this.handleError(socket, err)
          })
      })
  }

  /**
   * Clean up unused cursor data.
   */

  garbageCursors = (socket: SocketIO.Socket) => {
    const { name: docId } = socket.nsp
    try {
      const doc = this.backend.getDocument(docId)
      // if document has already been cleaned up, it is safe to return early
      if (!doc || !doc.cursors) return

      const namespace = this.io.of(docId)

      Object.keys(doc?.cursors)?.forEach(key => {
        if (!namespace.sockets[key]) {
          debugCollabBackend('Garbage cursor\t\t%s', key)
          this.backend.garbageCursor(docId, key)
        }
      })
    } catch (err) {
      this.handleError(socket, err)
    }
  }

  /**
   * Destroy SocketIO connection
   */

  destroy = async () => {
    this.io.close()
  }
}
