import Automerge from 'automerge'
import { Editor } from 'slate'
import { CollabAction, CursorData, SyncDoc } from '@hiveteams/collab-bridge'

interface ErrorData {
  docId: string
  serializedData: string
  opData?: string
  slateOperations?: string
}

export interface AutomergeOptions {
  docId: string
  cursorData?: CursorData
  preserveExternalHistory?: boolean
  onError?: (msg: string | Error, data: ErrorData) => void
}

export interface AutomergeEditor extends Editor {
  clientId: string

  isRemote: boolean

  docSet: Automerge.DocSet<SyncDoc>
  connection: Automerge.Connection<SyncDoc>

  onConnectionMsg: (msg: Automerge.Message) => void

  openConnection: () => void
  closeConnection: () => void

  receiveDocument: (data: string) => void
  receiveOperation: (data: Automerge.Message) => void

  gabageCursor: () => void

  onCursor: (data: any) => void

  handleError: (err: Error | string, opData?: string) => void
}

export interface SocketIOPluginOptions {
  url: string
  connectOpts: SocketIOClient.ConnectOpts
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (msg: string | Error, data: ErrorData) => void
}

export interface WithSocketIOEditor {
  clientId: string
  socket: SocketIOClient.Socket
  connect: () => void
  disconnect: () => void
  send: (op: CollabAction) => void
  receive: (op: CollabAction) => void
  destroy: () => void
}
