import React, { Component } from 'react'
import { KeyUtils } from 'slate'

import { hexGen } from '@slate-collaborative/bridge'

import Connection from './Connection'

import { ControllerProps } from './model'

class Controller extends Component<ControllerProps> {
  connection?: Connection

  state = {
    preloading: true
  }

  componentDidMount() {
    const { editor, url, connectOpts } = this.props

    KeyUtils.setGenerator(() => hexGen())

    editor.connection = new Connection({
      editor,
      url,
      connectOpts,
      onConnect: this.onConnect,
      onDisconnect: this.onDisconnect
    })

    //@ts-ignore
    if (!window.counter) {
      //@ts-ignore
      window.counter = 1
    }
    //@ts-ignore
    window[`Editor_${counter}`] = editor
    //@ts-ignore
    window.counter += 1
  }

  componentWillUnmount() {
    const { editor } = this.props

    if (editor.connection) editor.connection.close()

    delete editor.connection
  }

  render() {
    const { children, preloader } = this.props
    const { preloading } = this.state

    if (preloader && preloading) return preloader()

    return children
  }

  onConnect = () => {
    const { onConnect, editor } = this.props

    this.setState({
      preloading: false
    })

    onConnect && onConnect(editor.connection)
  }

  onDisconnect = () => {
    const { onDisconnect, editor } = this.props

    this.setState({
      preloading: true
    })

    onDisconnect && onDisconnect(editor.connection)
  }
}

export default Controller
