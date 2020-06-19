import { Editor } from 'slate'

export const toggleMark = (editor: Editor, format: any) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export const isMarkActive = (editor: Editor, format: any) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}
