import React, { PureComponent, ReactNode } from 'react'

import Connection from './Connection'

import { ControllerProps } from './model'

class Controller extends PureComponent<ControllerProps> {
  connection?: Connection

  state = {
    preloading: true
  }

  componentDidMount() {
    const { editor, url, connectOpts } = this.props

    editor.connection = new Connection({
      editor,
      url,
      connectOpts,
      onConnect: this.onConnect,
      onDisconnect: this.onDisconnect
    })
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
