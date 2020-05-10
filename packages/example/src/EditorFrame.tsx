import React, { useCallback } from 'react'

import { Transforms, Editor, Node } from 'slate'
import {
  Slate,
  ReactEditor,
  Editable,
  RenderLeafProps,
  useSlate
} from 'slate-react'

import { ClientFrame, IconButton, Icon } from './Elements'

import Caret from './Caret'

const LIST_TYPES = ['numbered-list', 'bulleted-list']

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

const toggleBlock = (editor: any, format: any) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type),
    split: true
  })

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format
  })

  if (!isActive && isList) {
    const block = { type: format, children: [] }
    Transforms.wrapNodes(editor, block)
  }
}

const toggleMark = (editor: any, format: any) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isBlockActive = (editor: any, format: any) => {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format
  })

  return !!match
}

const isMarkActive = (editor: any, format: any) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const Element: React.FC<any> = ({ attributes, children, element }) => {
  switch (element.type) {
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
