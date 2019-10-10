import { ExtendedEditor } from './model'

const onChange = opts => (editor: ExtendedEditor, next: () => void) => {
  if (editor.connection && !editor.remote) {
    const operations: any = editor.operations

    editor.connection.receiveSlateOps(operations)
  }

  return next()
}

export default onChange
