import React, { useState, useEffect, useMemo } from 'react'

import { createEditor, Node } from 'slate'
import { Slate, Editable, withReact, RenderLeafProps } from 'slate-react'

import randomColor from 'randomcolor'

import styled from '@emotion/styled'

import { withIOCollaboration, useCursor } from '@slate-collaborative/client'

import { Instance, ClientFrame, Title, H4, Button } from './Elements'

const defaultValue: Node[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: ''
      }
    ]
  }
]

interface ClientProps {
  name: string
  id: string
  slug: string
  removeUser: (id: any) => void
}

const Client: React.FC<ClientProps> = ({ id, name, slug, removeUser }) => {
  const [value, setValue] = useState<Node[]>(defaultValue)
  const [isOnline, setOnlineState] = useState<boolean>(false)

  const color = useMemo(
    () =>
      randomColor({
        luminosity: 'dark',
        format: 'rgba',
        alpha: 1
      }),
    []
  )

  const editor = useMemo(() => {
    const slateEditor = withReact(createEditor())

    const origin =
      process.env.NODE_ENV === 'production'
        ? window.location.origin
        : 'http://localhost:9000'

    const options = {
      docId: '/' + slug,
      cursorData: {
        name,
        color,
        alphaColor: color.slice(0, -2) + '0.2)'
      },
      url: `${origin}/${slug}`,
      connectOpts: {
        query: {
          name,
          token: id,
          slug
        }
      },
      onConnect: () => setOnlineState(true),
      onDisconnect: () => setOnlineState(false)
    }

    return withIOCollaboration(slateEditor, options)
  }, [])

  useEffect(() => {
    editor.connect()

    return editor.destroy
  }, [])

  const { decorate } = useCursor(editor)

  const toggleOnline = () => {
    const { connect, disconnect } = editor
    isOnline ? disconnect() : connect()
  }

  return (
    <Instance online={isOnline}>
      <Title>
        <Head>Editor: {name}</Head>
        <Button type="button" onClick={toggleOnline}>
          Go {isOnline ? 'offline' : 'online'}
        </Button>
        <Button type="button" onClick={() => removeUser(id)}>
          Remove
        </Button>
      </Title>
      <ClientFrame>
        <Slate
          editor={editor}
          value={value}
          onChange={value => setValue(value)}
        >
          <Editable
            decorate={decorate}
            renderLeaf={props => <Leaf {...props} />}
          />
        </Slate>
      </ClientFrame>
    </Instance>
  )
}

export default Client

const Head = styled(H4)`
  margin-right: auto;
`

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  return (
    <span
      {...attributes}
      style={{
        position: 'relative',
        backgroundColor: leaf.alphaColor
      }}
    >
      {leaf.isCaret ? <Caret {...(leaf as any)} /> : null}
      {children}
    </span>
  )
}

const cursorStyleBase = {
  position: 'absolute',
  top: -2,
  pointerEvents: 'none',
  userSelect: 'none',
  transform: 'translateY(-100%)',
  fontSize: 10,
  color: 'white',
  background: 'palevioletred',
  whiteSpace: 'nowrap'
} as any

const caretStyleBase = {
  position: 'absolute',
  top: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  height: '100%',
  width: 2,
  background: 'palevioletred'
} as any

interface Caret {
  color: string
  isForward: boolean
  name: string
}

const Caret: React.FC<Caret> = ({ color, isForward, name }) => {
  const cursorStyles = {
    ...cursorStyleBase,
    background: color,
    left: isForward ? '100%' : '0%'
  }
  const caretStyles = {
    ...caretStyleBase,
    background: color,
    left: isForward ? '100%' : '0%'
  }

  return (
    <>
      <span contentEditable={false} style={cursorStyles}>
        {name}
      </span>
      <span contentEditable={false} style={caretStyles} />
    </>
  )
}
