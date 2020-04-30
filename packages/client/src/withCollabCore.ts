import Automerge from 'automerge'

import { Editor } from 'slate'

import { CollabEditor } from './collab-editor'

export interface CollabCoreOptions {
  docId: string
  cursorData?: {
    [key: string]: any
  }
}

/**
 * The `withCollabCore` plugin contains core collaboration logic.
 */

const withCollabCore = <T extends Editor>(
  editor: T,
  options: CollabCoreOptions
) => {
  const e = editor as T & CollabEditor

  const { onChange } = e

  const { docId, cursorData } = options || {}

  e.docSet = new Automerge.DocSet()

  /**
   * Open Automerge Connection
   */

  e.openConnection = () => {
    e.connection = CollabEditor.createConnection(e, (data: any) => e.send(data))

    e.connection.open()
  }

  /**
   * Close Automerge Connection
   */

  e.closeConnection = () => {
    e.connection.close()
  }

  /**
   * Editor onChange
   */

  e.onChange = () => {
    const operations: any = e.operations

    if (!e.isRemote) {
      CollabEditor.applySlateOps(e, docId, operations, cursorData)
    }

    onChange()
  }

  /**
   * Receive document value
   */

  e.receiveDocument = data => {
    CollabEditor.receiveDocument(e, docId, data)
  }

  /**
   * Receive Automerge sync operations
   */

  e.receiveOperation = data => {
    if (docId !== data.docId) return

    CollabEditor.applyOperation(e, docId, data)
  }

  return e
}

export default withCollabCore
