import { Editor, Controller, Value } from 'slate'
import { PluginOptions } from './index'
import Connection from './Connection'

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
  onConnect: () => void
  onDisconnect: () => void
}

export interface ControllerProps extends PluginOptions {
  editor: ExtendedEditor
  url?: string
  connectOpts?: SocketIOClient.ConnectOpts
}
