import { ExtendedEditor } from './model'

const onChange = opts => (editor: ExtendedEditor, next: () => void) => {
  if (!editor.remote) {
    editor.connection.receiveSlateOps(editor.operations)
  }

  return next()
}

export default onChange
