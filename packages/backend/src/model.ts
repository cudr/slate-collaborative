import { Node } from 'slate'
import { Server } from 'http'

export interface ConnectionOptions {
  entry: number | Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: Node
  saveTreshold?: number
  cursorAnnotationType?: string
  onAuthRequest?: (
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad?: (
    pathname: string,
    query?: Object
  ) => Node | null | false | undefined
  onDocumentSave?: (pathname: string, json: Node) => Promise<void> | void
}
