import { Transforms, Editor } from 'slate'

const LIST_TYPES: string[] = ['numbered-list', 'bulleted-list']

export const toggleBlock = (editor: any, format: any) => {
  const isActive = isBlockActive(editor, format)
  const isList = LIST_TYPES.includes(format)

  Transforms.unwrapNodes(editor, {
    match: n => LIST_TYPES.includes(n.type as any),
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

export const isBlockActive = (editor: any, format: any) => {
  const [match] = Editor.nodes(editor, {
    match: n => n.type === format
  })

  return !!match
}
