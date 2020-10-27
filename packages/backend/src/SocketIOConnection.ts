import io from 'socket.io'
import * as Automerge from 'automerge'
import { Node } from 'slate'
import { Server } from 'http'

import throttle from 'lodash/throttle'

import { SyncDoc, CollabAction, toJS } from '@slate-sheikah/bridge'

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
export interface BackendCounts {
  [key: string]: number
}

export default class SocketIOCollaboration {
  private io: SocketIO.Server
  private options: SocketIOCollaborationOptions
  private backends: AutomergeBackend[] = []
  private backendCounts: BackendCounts[] = []

  /**
   * Constructor
   */

  constructor(options: SocketIOCollaborationOptions) {
    this.io = io(options.entry, options.connectOpts)

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
    return next(null, true)
    //this is needed to set up the namespace, but it only runs once.
    //the logic that WAS in here needs to be able to be ran multiple times.
  }

  /**
   * init function to set up new documents is they don't exist.  These get cleaned up once
   * all the sockets disconnect.
   * @param socket
   */
  private init = async (socket: SocketIO.Socket) => {
    try {
      const path = socket.nsp.name;
      const query = socket.handshake.query;
      const { onDocumentLoad } = this.options

      //make some backends if this is the first time this meeting is loaded.
      if(!this.backends[path]){
        this.backends[path] = new AutomergeBackend();
        this.backendCounts[path] = 0;

        if (!this.backends[path].getDocument(path)) {
          const doc = onDocumentLoad
            ? await onDocumentLoad(path, query)
            : this.options.defaultValue

          if (doc) {
            this.backends[path].appendDocument(path, doc)
          }
        }
      }

      this.backendCounts[path] = this.backendCounts[path] + 1;

    } catch (e){
      console.log('Error in slate-collab init', e);
    }
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

  private onConnect = async (socket: SocketIO.Socket) => {
    try{
      const { id, conn } = socket
      const { name } = socket.nsp
      await this.init(socket);

      this.backends[name].createConnection(id, ({ type, payload }: CollabAction) => {
        socket.emit('msg', { type, payload: { id: conn.id, ...payload } })
      })

      socket.on('msg', this.onMessage(id, name))

      socket.on('disconnect', this.onDisconnect(id, socket))

      socket.join(id, () => {
        const doc = this.backends[name].getDocument(name)

        socket.emit('msg', {
          type: 'document',
          payload: Automerge.save<SyncDoc>(doc)
        })

        this.backends[name].openConnection(id)
      })

      this.garbageCursors(name)
    } catch (e) {
      console.log('Error in slate-collab onConnect', e);
    }

  }

  /**
   * On 'message' handler
   */

  private onMessage = (id: string, name: string) => (data: any) => {
    switch (data.type) {
      case 'operation':
        try {
          this.backends[name].receiveOperation(id, data)

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

      const doc = this.backends[docId].getDocument(docId)

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
    try {
      this.backends[socket.nsp.name].closeConnection(id)
      this.backendCounts[socket.nsp.name] = this.backendCounts[socket.nsp.name] - 1

      await this.saveDocument(socket.nsp.name)

      this.garbageCursors(socket.nsp.name)

      socket.leave(id)

      this.garbageNsp()

      //if all the sockets have disconnected, free up that precious, precious memory.
      if(this.backendCounts[socket.nsp.name] == 0){
        delete this.backends[socket.nsp.name]
      }
    } catch (e) {
      console.log('Error in slate-collab onDisconnect', e);
    }
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
            this.backends[nsp].removeDocument(nsp)

            delete this.io.nsps[nsp]
          }
        })
      })
  }

  /**
   * Clean up unused cursor data.
   */

  garbageCursors = (nsp: string) => {
    const doc = this.backends[nsp].getDocument(nsp)

    if (!doc.cursors) return

    const namespace = this.io.of(nsp)

    Object.keys(doc?.cursors)?.forEach(key => {
      if (!namespace.sockets[key]) {
        this.backends[nsp].garbageCursor(nsp, key)
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
