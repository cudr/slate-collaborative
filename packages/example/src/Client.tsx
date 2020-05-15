import React, { useState, useEffect, useMemo } from 'react'

import { createEditor, Node } from 'slate'
import { withHistory } from 'slate-history'
import { withReact } from 'slate-react'

import randomColor from 'randomcolor'

import styled from '@emotion/styled'

import { withIOCollaboration, useCursor } from '@slate-collaborative/client'

import { Instance, Title, H4, Button } from './Components'

import EditorFrame from './EditorFrame'

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
    const slateEditor = withReact(withHistory(createEditor()))

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
        <div style={{ display: 'flex', marginTop: 10, marginBottom: 10 }}>
          <Button type="button" onClick={toggleOnline}>
            Go {isOnline ? 'offline' : 'online'}
          </Button>
          <Button type="button" onClick={() => removeUser(id)}>
            Remove
          </Button>
        </div>
      </Title>

      <EditorFrame
        editor={editor}
        value={value}
        decorate={decorate}
        onChange={(value: Node[]) => setValue(value)}
      />
    </Instance>
  )
}

export default Client

const Head = styled(H4)`
  margin-right: auto;
`
