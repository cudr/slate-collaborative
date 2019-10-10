import { ReactNode } from 'react'

import onChange from './onChange'
import renderEditor from './renderEditor'
import renderAnnotation from './renderAnnotation'

import Connection from './Connection'

export interface PluginOptions {
  url?: string
  connectOpts?: SocketIOClient.ConnectOpts
  preloader?: () => ReactNode
  onConnect?: (connection: Connection) => void
  onDisconnect?: (connection: Connection) => void
}

const defaultOpts = {
  url: 'http://localhost:9000'
}

const plugin = (opts: PluginOptions = {}) => {
  const options = { ...defaultOpts, ...opts }

  return {
    onChange: onChange(options),
    renderEditor: renderEditor(options),
    renderAnnotation
  }
}

export default plugin
