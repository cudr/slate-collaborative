import { Editor } from 'slate'
import { PluginOptions } from './index'
import Connection from './Connection'

export interface ConnectionModel extends PluginOptions {
  editor: Editor
  onConnect: () => void
  onDisconnect: () => void
}

export interface ExtendedEditor extends Editor {
  remote: boolean
  connection: Connection
}

export interface ControllerProps extends PluginOptions {
  editor: ExtendedEditor
  url?: string
  connectOpts?: SocketIOClient.ConnectOpts
}
