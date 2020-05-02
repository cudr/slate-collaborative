import io from 'socket.io-client'

import { CollabEditor } from './collab-editor'

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
 * The `withSocketIO` plugin contains socketIO layer logic.
 */

const withSocketIO = <T extends CollabEditor>(
  editor: T,
  options: SocketIOPluginOptions
) => {
  const e = editor as T & WithSocketIOEditor

  const { onConnect, onDisconnect, connectOpts, url, autoConnect } = options

  e.connect = () => {
    e.socket = io(url, { ...connectOpts })

    e.socket.on('msg', (data: CollabAction) => {
      e.receive(data)
    })

    e.socket.on('connect', () => {
      e.clientId = e.socket.id

      e.openConnection()

      onConnect && onConnect()
    })

    e.socket.on('disconnect', () => onDisconnect && onDisconnect())

    e.socket.connect()

    return e
  }

  e.disconnect = () => {
    e.socket.removeListener('msg')

    e.socket.close()

    e.closeConnection()

    return e
  }

  e.receive = (msg: CollabAction) => {
    switch (msg.type) {
      case 'operation':
        return e.receiveOperation(msg.payload)
      case 'document':
        return e.receiveDocument(msg.payload)
    }
  }

  e.send = (msg: CollabAction) => {
    e.socket.emit('msg', msg)
  }

  e.destroy = () => {
    e.socket.close()

    e.closeConnection()
  }

  autoConnect && e.connect()

  return e
}

export default withSocketIO
