import Automerge from 'automerge'

import { Editor } from 'slate'

import { AutomergeEditor } from './automerge-editor'

import { CursorData, CollabAction } from '@slate-collaborative/bridge'

export interface AutomergeOptions {
  docId: string
  cursorData?: CursorData
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

  const { docId, cursorData } = options || {}

  e.docSet = new Automerge.DocSet()

  e.connection = AutomergeEditor.createConnection(e, (data: CollabAction) =>
    e.send(data)
  )

  /**
   * Open Automerge Connection
   */

  e.openConnection = () => {
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
      AutomergeEditor.applySlateOps(e, docId, operations, cursorData)
    }

    onChange()

    // console.log('e', e.children)
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

    AutomergeEditor.applyOperation(e, docId, data)
  }

  return e
}

export default withAutomerge
