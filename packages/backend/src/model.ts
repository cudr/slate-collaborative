import { ValueJSON } from 'slate'
import { Server } from 'http'

export interface ConnectionOptions {
  entry: number | Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: ValueJSON
  saveTreshold?: number
  cursorAnnotationType?: string
  onAuthRequest?: (
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad?: (
    pathname: string,
    query?: Object
  ) => ValueJSON | null | false | undefined
  onDocumentSave?: (pathname: string, json: ValueJSON) => Promise<void> | void
}
