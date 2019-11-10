import React, { Component } from 'react'

import { Value, ValueJSON } from 'slate'
import { Editor } from 'slate-react'
import randomColor from 'randomcolor'

import styled from '@emotion/styled'

import ClientPlugin from '@slate-collaborative/client'

import defaultValue from './defaultValue'

import { Instance, ClientFrame, Title, H4, Button } from './elements'

interface ClienProps {
  name: string
  id: string
  slug: string
  removeUser: (id: any) => void
}

class Client extends Component<ClienProps> {
  editor: any

  state = {
    value: Value.fromJSON(defaultValue as ValueJSON),
    isOnline: false,
    plugins: []
  }

  componentDidMount() {
    const color = randomColor({
      luminosity: 'dark',
      format: 'rgba',
      alpha: 1
    })

    const origin =
      process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:9000'

    const options = {
      url: `${origin}/${this.props.slug}`,
      connectOpts: {
        query: {
          name: this.props.name,
          token: this.props.id,
          slug: this.props.slug
        }
      },
      annotationDataMixin: {
        name: this.props.name,
        color,
        alphaColor: color.slice(0, -2) + '0.2)'
      },
      // renderPreloader: () => <div>PRELOADER!!!!!!</div>,
      onConnect: this.onConnect,
      onDisconnect: this.onDisconnect
    }

    const plugin = ClientPlugin(options)

    this.setState({
      plugins: [plugin]
    })
  }

  render() {
    const { plugins, isOnline, value } = this.state
    const { id, name } = this.props

    return (
      <Instance online={isOnline}>
        <Title>
          <Head>Editor: {name}</Head>
          <Button type="button" onClick={this.toggleOnline}>
            Go {isOnline ? 'offline' : 'online'}
          </Button>
          <Button type="button" onClick={() => this.props.removeUser(id)}>
            Remove
          </Button>
        </Title>
        <ClientFrame>
          <Editor
            value={value}
            ref={this.ref}
            plugins={plugins}
            onChange={this.onChange}
          />
        </ClientFrame>
      </Instance>
    )
  }

  onChange = ({ value }: any) => this.setState({ value })

  onConnect = () => this.setState({ isOnline: true })

  onDisconnect = () => this.setState({ isOnline: false })

  ref = node => {
    this.editor = node
  }

  toggleOnline = () => {
    const { isOnline } = this.state
    const { connect, disconnect } = this.editor.connection

    isOnline ? disconnect() : connect()
  }
}

export default Client

const Head = styled(H4)`
  margin-right: auto;
`
