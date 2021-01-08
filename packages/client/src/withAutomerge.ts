import Automerge from 'automerge'

import { Editor } from 'slate'

import { AutomergeConnector } from './automerge-connector'

import { CollabAction } from '@hiveteams/collab-bridge'
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

  editor.handleError = (err: Error | string, opData?: string) => {
    const { docId, cursorData, onError } = options
    if (onError && cursorData) {
      const document = editor.docSet.getDoc(docId)
      onError(err, {
        docId: docId,
        serializedData: document ? Automerge.save(document) : 'No document',
        opData,
        slateOperations: JSON.stringify(editor.operations)
      })
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

  editor.gabageCursor = () => {
    try {
      AutomergeConnector.garbageCursor(editor, docId)
    } catch (err) {
      editor.handleError(err)
    }
  }

  /**
   * Editor onChange
   */
  editor.onChange = () => {
    const operations = editor.operations

    if (!editor.isRemote) {
      try {
        AutomergeConnector.applySlateOps(editor, docId, operations, cursorData)
      } catch (err) {
        editor.handleError(err)
      }

      onChange()
    }
  }

  /**
   * Receive document value
   */

  editor.receiveDocument = data => {
    try {
      AutomergeConnector.receiveDocument(editor, docId, data)
    } catch (err) {
      editor.handleError(err, JSON.stringify(data))
    }
  }

  /**
   * Receive Automerge sync operations
   */

  editor.receiveOperation = data => {
    // ignore document updates for differnt docIds
    if (docId !== data.docId) return

    try {
      AutomergeConnector.applyOperation(
        editor,
        docId,
        data,
        preserveExternalHistory
      )
    } catch (err) {
      editor.handleError(err, JSON.stringify(data))
    }
  }

  return editor
}

export default withAutomerge
