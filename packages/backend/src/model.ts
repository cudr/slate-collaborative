import { Element } from 'slate'
import { Server } from 'http'

export interface ConnectionOptions {
  entry: number | Server
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: Element[]
  saveFrequency?: number
  cursorAnnotationType?: string
  onAuthRequest?: (
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad?: (pathname: string, query?: Object) => Element[]
  onDocumentSave?: (pathname: string, json: Element[]) => Promise<void> | void
}
