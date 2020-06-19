import isUrl from 'is-url'

import { Transforms, Editor, Range } from 'slate'

export interface LinkEditor extends Editor {
  insertData: (data: any) => void
}

export const withLinks = <T extends Editor>(editor: T) => {
  const e = editor as T & LinkEditor

  const { insertData, insertText, isInline } = e

  e.isInline = (element: any) => {
    return element.type === 'link' ? true : isInline(element)
  }

  e.insertText = (text: string) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertText(text)
    }
  }

  e.insertData = (data: any) => {
    const text = data.getData('text/plain')

    if (text && isUrl(text)) {
      wrapLink(editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

export const insertLink = (editor: Editor, href: string) => {
  if (editor.selection) {
    wrapLink(editor, href)
  }
}

export const isLinkActive = (editor: Editor) => {
  const [link] = Editor.nodes(editor, { match: n => n.type === 'link' })
  return !!link
}

export const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, { match: n => n.type === 'link' })
}

export const wrapLink = (editor: Editor, href: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor)
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)
  const link = {
    type: 'link',
    href,
    children: isCollapsed ? [{ text: href }] : []
  }

  if (isCollapsed) {
    Transforms.insertNodes(editor, link)
  } else {
    Transforms.wrapNodes(editor, link, { split: true })
    Transforms.collapse(editor, { edge: 'end' })
  }
}
