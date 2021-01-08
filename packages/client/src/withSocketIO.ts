import io from 'socket.io-client'

import Automerge from 'automerge'
import { CollabAction } from '@hiveteams/collab-bridge'
import {
  AutomergeEditor,
  AutomergeOptions,
  SocketIOPluginOptions,
  WithSocketIOEditor
} from './interfaces'

/**
 * The `withSocketIO` plugin contains SocketIO layer logic.
 */

const withSocketIO = <T extends AutomergeEditor>(
  slateEditor: T,
  options: SocketIOPluginOptions & AutomergeOptions
) => {
  const { onConnect, onDisconnect, connectOpts, url } = options
  const editor = slateEditor as T & WithSocketIOEditor & AutomergeEditor
  let socket: SocketIOClient.Socket

  /**
   * Connect to Socket.
   */

  editor.connect = () => {
    socket = io(url, { ...connectOpts })

    // On socket io connect, open a new automerge connection
    socket.on('connect', () => {
      editor.clientId = socket.id
      editor.openConnection()
      onConnect && onConnect()
    })

    // On socket io error
    socket.on('error', (msg: string) => {
      editor.handleError(msg)
    })

    // On socket io msg, process the collab operation
    socket.on('msg', (data: CollabAction) => {
      editor.receive(data)
    })

    // On socket io disconnect, cleanup cursor and call the provided onDisconnect callback
    socket.on('disconnect', () => {
      editor.gabageCursor()
      onDisconnect && onDisconnect()
    })

    socket.connect()

    return editor
  }

  /**
   * Disconnect from Socket.
   */

  editor.disconnect = () => {
    socket.removeListener('msg')

    socket.close()

    editor.closeConnection()

    return editor
  }

  /**
   * Receive transport msg.
   */

  editor.receive = (msg: CollabAction) => {
    switch (msg.type) {
      case 'operation':
        return editor.receiveOperation(msg.payload)
      case 'document':
        return editor.receiveDocument(msg.payload)
    }
  }

  /**
   * Send message to socket.
   */

  editor.send = (msg: CollabAction) => {
    socket.emit('msg', msg)
  }

  /**
   * Close socket and connection.
   */

  editor.destroy = () => {
    socket.close()
    editor.closeConnection()
  }

  return editor
}

export default withSocketIO
