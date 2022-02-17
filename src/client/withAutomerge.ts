import Automerge from 'automerge'

import { Editor } from 'slate'

import { AutomergeConnector } from './automerge-connector'

import { CollabAction } from 'bridge/index'
import {
  AutomergeEditor,
  AutomergeOptions,
  WithSocketIOEditor
} from './interfaces'

/**
 * The `withAutomerge` plugin contains core collaboration logic.
 */

const withAutomerge = <T extends Editor>(
  slateEditor: T,
  options: AutomergeOptions
) => {
  const { docId, cursorData, preserveExternalHistory } = options || {}

  const editor = slateEditor as T & AutomergeEditor & WithSocketIOEditor

  const { onChange } = editor

  editor.docSet = new Automerge.DocSet()

  /**
   * Helper function for handling errors
   */

  editor.handleError = (err: unknown | string, data: any = {}) => {
    const { onError } = options
    if (onError) {
      onError(err, data)
    }
  }

  /**
   * Open Automerge Connection
   */

  editor.openConnection = () => {
    editor.connection = AutomergeConnector.createConnection(
      editor,
      (data: CollabAction) => editor.send(data)
    )

    editor.connection.open()
  }

  /**
   * Close Automerge Connection
   */

  editor.closeConnection = () => {
    // close any actively open connections
    if (editor.connection) {
      editor.connection.close()
    }
  }

  /**
   * Clear cursor data
   */

  editor.garbageCursor = () => {
    AutomergeConnector.garbageCursor(editor, docId)
  }

  /**
   * Editor onChange
   */
  editor.onChange = () => {
    const operations = editor.operations

    if (!editor.isRemote) {
      AutomergeConnector.applySlateOps(editor, docId, operations, cursorData)
      onChange()
    }
  }

  /**
   * Receive document value
   */

  editor.receiveDocument = data => {
    AutomergeConnector.receiveDocument(editor, docId, data)
  }

  /**
   * Receive Automerge sync operations
   */

  editor.receiveOperation = data => {
    // ignore document updates for differnt docIds
    if (docId !== data.docId) return

    AutomergeConnector.applyOperation(
      editor,
      docId,
      data,
      preserveExternalHistory
    )
  }

  return editor
}

export default withAutomerge
