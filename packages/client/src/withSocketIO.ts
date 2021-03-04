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
  const {
    onConnect,
    onDisconnect,
    connectOpts,
    url,
    docId,
    resetOnReconnect
  } = options
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

      // If the resetOnReconnect option is true we should close our connection
      // and remove our document from the docSet if the user has already received
      // a document from our collab server
      if (resetOnReconnect && editor.docSet.getDoc(docId)) {
        if (editor.connection) {
          editor.connection.close()
        }
        editor.docSet.removeDoc(docId)
      }

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
      editor.garbageCursor()
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
