import io from 'socket.io-client'

import { AutomergeEditor } from './automerge-editor'

import { CollabAction } from '@slate-collaborative/bridge'

export interface SocketIOPluginOptions {
  url: string
  connectOpts: SocketIOClient.ConnectOpts
  autoConnect?: boolean

  onConnect?: () => void
  onDisconnect?: () => void
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

  const { onConnect, onDisconnect, connectOpts, url, autoConnect } = options

  /**
   * Connect to Socket.
   */

  e.connect = () => {
    if (!e.socket) {
      e.socket = io(url, { ...connectOpts })

      e.socket.on('connect', () => {
        e.clientId = e.socket.id

        e.openConnection()

        onConnect && onConnect()
      })

      e.socket.on('disconnect', () => onDisconnect && onDisconnect())
    }

    e.socket.on('msg', (data: CollabAction) => {
      e.receive(data)
    })

    e.socket.connect()

    return e
  }

  /**
   * Disconnect from Socket.
   */

  e.disconnect = () => {
    e.socket.removeListener('msg')

    e.socket.close()

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
    e.socket.emit('msg', msg)
  }

  /**
   * Close socket and connection.
   */

  e.destroy = () => {
    e.socket.close()

    e.closeConnection()
  }

  autoConnect && e.connect()

  return e
}

export default withSocketIO
