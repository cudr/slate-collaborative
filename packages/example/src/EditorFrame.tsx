import React, { useCallback } from 'react'

import { Node } from 'slate'

import {
  Slate,
  ReactEditor,
  Editable,
  RenderLeafProps,
  useSlate
} from 'slate-react'

import { ClientFrame, IconButton, Icon } from './Components'

import Caret from './Caret'

import { isBlockActive, toggleBlock } from './plugins/block'
import { isMarkActive, toggleMark } from './plugins/mark'
import { isLinkActive, insertLink, unwrapLink } from './plugins/link'

export interface EditorFrame {
  editor: ReactEditor
  value: Node[]
  decorate: any
  onChange: (value: Node[]) => void
}

const renderElement = (props: any) => <Element {...props} />

const EditorFrame: React.FC<EditorFrame> = ({
  editor,
  value,
  decorate,
  onChange
}) => {
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [
    decorate
  ])

  return (
    <ClientFrame>
      <Slate editor={editor} value={value} onChange={onChange}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1
          }}
        >
          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />
          <MarkButton format="code" icon="code" />

          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="block-quote" icon="format_quote" />

          <BlockButton format="numbered-list" icon="format_list_numbered" />
          <BlockButton format="bulleted-list" icon="format_list_bulleted" />

          <LinkButton />
        </div>

        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          decorate={decorate}
        />
      </Slate>
    </ClientFrame>
  )
}

export default EditorFrame

const Element: React.FC<any> = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'link':
      return (
        <a {...attributes} href={element.href}>
          {children}
        </a>
      )
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>
    default:
      return <p {...attributes}>{children}</p>
  }
}

const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return (
    <span
      {...attributes}
      style={
        {
          position: 'relative',
          backgroundColor: leaf.alphaColor
        } as any
      }
    >
      {leaf.isCaret ? <Caret {...(leaf as any)} /> : null}
      {children}
    </span>
  )
}

const BlockButton: React.FC<any> = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <IconButton
      active={isBlockActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleBlock(editor, format)
      }}
    >
      <Icon className="material-icons">{icon}</Icon>
    </IconButton>
  )
}

const MarkButton: React.FC<any> = ({ format, icon }) => {
  const editor = useSlate()
  return (
    <IconButton
      active={isMarkActive(editor, format)}
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      <Icon className="material-icons">{icon}</Icon>
    </IconButton>
  )
}

const LinkButton = () => {
  const editor = useSlate()

  const isActive = isLinkActive(editor)

  return (
    <IconButton
      active={isActive}
      onMouseDown={event => {
        event.preventDefault()

        if (isActive) return unwrapLink(editor)

        const url = window.prompt('Enter the URL of the link:')

        url && insertLink(editor, url)
      }}
    >
      <Icon className="material-icons">link</Icon>
    </IconButton>
  )
}
