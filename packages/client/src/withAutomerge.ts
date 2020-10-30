import Automerge from 'automerge'

import { Editor } from 'slate'

import { AutomergeEditor } from './automerge-editor'

import { CursorData, CollabAction } from '@hiveteams/collab-bridge'

export interface AutomergeOptions {
  docId: string
  cursorData?: CursorData
  preserveExternalHistory?: boolean
  onError?: (msg: string | Error) => void
}

/**
 * The `withAutomerge` plugin contains core collaboration logic.
 */

const withAutomerge = <T extends Editor>(
  editor: T,
  options: AutomergeOptions
) => {
  const e = editor as T & AutomergeEditor

  const { onChange } = e

  const {
    docId,
    cursorData,
    preserveExternalHistory,
    onError = (err: string | Error) => console.log('AutomergeEditor error', err)
  } = options || {}

  e.docSet = new Automerge.DocSet()

  const createConnection = () => {
    e.connection = AutomergeEditor.createConnection(e, (data: CollabAction) =>
      //@ts-ignore
      e.send(data)
    )

    e.connection.open()
  }

  /**
   * Open Automerge Connection
   */

  e.openConnection = () => {
    createConnection()

    e.connection.open()
  }

  /**
   * Close Automerge Connection
   */

  e.closeConnection = () => {
    e.connection.close()
  }

  /**
   * Clear cursor data
   */

  e.gabageCursor = () => {
    try {
      AutomergeEditor.garbageCursor(e, docId)
    } catch (err) {
      console.log('garbageCursor error', err)
    }
  }

  /**
   * Editor onChange
   */

  e.onChange = () => {
    const operations: any = e.operations

    if (!e.isRemote) {
      AutomergeEditor.applySlateOps(e, docId, operations, cursorData).catch(
        onError
      )

      onChange()
    }
  }

  /**
   * Receive document value
   */

  e.receiveDocument = data => {
    AutomergeEditor.receiveDocument(e, docId, data)
  }

  /**
   * Receive Automerge sync operations
   */

  e.receiveOperation = data => {
    if (docId !== data.docId) return

    try {
      AutomergeEditor.applyOperation(e, docId, data, preserveExternalHistory)
    } catch (err) {
      // report any errors during apply operation
      onError(err)
    }
  }

  return e
}

export default withAutomerge
