import io from 'socket.io-client'

import { AutomergeEditor } from './automerge-editor'

import { CollabAction } from '@hiveteams/collab-bridge'

export interface SocketIOPluginOptions {
  url: string
  connectOpts: SocketIOClient.ConnectOpts
  autoConnect?: boolean

  onConnect?: () => void
  onDisconnect?: () => void

  onError?: (msg: string) => void
}

export interface WithSocketIOEditor {
  socket: SocketIOClient.Socket

  connect: () => void
  disconnect: () => void

  send: (op: CollabAction) => void
  receive: (op: CollabAction) => void

  destroy: () => void
}

/**
 * The `withSocketIO` plugin contains SocketIO layer logic.
 */

const withSocketIO = <T extends AutomergeEditor>(
  editor: T,
  options: SocketIOPluginOptions
) => {
  const e = editor as T & WithSocketIOEditor
  let socket: SocketIOClient.Socket

  const {
    onConnect,
    onDisconnect,
    onError,
    connectOpts,
    url,
    autoConnect
  } = options

  /**
   * Connect to Socket.
   */

  e.connect = () => {
    if (!socket) {
      socket = io(url, { ...connectOpts })

      socket.on('connect', () => {
        e.clientId = socket.id

        e.openConnection()

        onConnect && onConnect()
      })
    }

    socket.on('error', (msg: string) => {
      onError && onError(msg)
    })

    socket.on('msg', (data: CollabAction) => {
      e.receive(data)
    })

    socket.on('disconnect', () => {
      e.gabageCursor()

      onDisconnect && onDisconnect()
    })

    socket.connect()

    return e
  }

  /**
   * Disconnect from Socket.
   */

  e.disconnect = () => {
    socket.removeListener('msg')

    socket.close()

    e.closeConnection()

    return e
  }

  /**
   * Receive transport msg.
   */

  e.receive = (msg: CollabAction) => {
    switch (msg.type) {
      case 'operation':
        return e.receiveOperation(msg.payload)
      case 'document':
        return e.receiveDocument(msg.payload)
    }
  }

  /**
   * Send message to socket.
   */

  e.send = (msg: CollabAction) => {
    socket.emit('msg', msg)
  }

  /**
   * Close socket and connection.
   */

  e.destroy = () => {
    socket.close()
    e.closeConnection()
  }

  autoConnect && e.connect()

  return e
}

export default withSocketIO
