import { ReactNode } from 'react'
import { Editor, Controller, Value } from 'slate'

import Connection from './Connection'

type Data = {
  [key: string]: any
}

interface FixedController extends Controller {
  setValue: (value: Value) => void
}

export interface ExtendedEditor extends Editor {
  remote?: boolean
  connection?: Connection
  controller: FixedController
  setFocus: () => void
}

export interface ConnectionModel extends PluginOptions {
  editor: ExtendedEditor
  cursorAnnotationType: string
  onConnect: () => void
  onDisconnect: () => void
}

export interface ControllerProps extends PluginOptions {
  editor: ExtendedEditor
  url?: string
  connectOpts?: SocketIOClient.ConnectOpts
}

export interface PluginOptions {
  url?: string
  connectOpts?: SocketIOClient.ConnectOpts
  cursorAnnotationType?: string
  annotationDataMixin?: Data
  renderPreloader?: () => ReactNode
  renderCursor?: (data: Data) => ReactNode | any
  onConnect?: (connection: Connection) => void
  onDisconnect?: (connection: Connection) => void
}
