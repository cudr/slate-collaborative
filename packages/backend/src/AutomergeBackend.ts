import * as Automerge from 'automerge'

import { Node } from 'slate'

import {
  toCollabAction,
  toSync,
  SyncDoc,
  CollabAction
} from '@hiveteams/collab-bridge'
import { debugCollabBackend } from 'utils/debug'

/**
 * AutomergeBackend contains collaboration with Automerge
 */

class AutomergeBackend {
  connectionMap: { [key: string]: Automerge.Connection<SyncDoc> } = {}
  documentSetMap: { [key: string]: Automerge.DocSet<SyncDoc> } = {}

  /**
   * Create Autmorge Connection
   */

  createConnection = (id: string, docId: string, send: any) => {
    if (this.connectionMap[id]) {
      console.warn(
        `Already has connection with id: ${id}. It will be terminated before creating new connection`
      )

      this.closeConnection(id)
    }

    if (!this.documentSetMap[docId]) {
      throw new Error('Cannot create connection for missing docSet')
    }

    this.connectionMap[id] = new Automerge.Connection(
      this.documentSetMap[docId],
      toCollabAction('operation', send)
    )
  }

  /**
   * Start Automerge Connection
   */

  openConnection = (id: string) => this.connectionMap[id].open()

  /**
   * Close Automerge Connection and remove it from connections
   */

  closeConnection(id: string) {
    this.connectionMap[id]?.close()

    delete this.connectionMap[id]
  }

  /**
   * Receive and apply operation to Automerge Connection
   */

  receiveOperation = (id: string, data: CollabAction) => {
    try {
      if (!this.connectionMap[id]) {
        debugCollabBackend('Could not receive op for closed connection %s', id)
        return
      }

      this.connectionMap[id].receiveMsg(data.payload)
    } catch (e) {
      console.error('Unexpected error in receiveOperation', e)
    }
  }

  /**
   * Get document from Automerge DocSet
   */

  getDocument = (docId: string) => this.documentSetMap[docId]?.getDoc(docId)

  /**
   * Append document to Automerge DocSet
   */

  appendDocument = (docId: string, data: Node[]) => {
    try {
      if (this.getDocument(docId)) {
        throw new Error(`Already has document with id: ${docId}`)
      }

      const sync = toSync({ cursors: {}, children: data })

      const doc = Automerge.from<SyncDoc>(sync)

      if (!this.documentSetMap[docId]) {
        this.documentSetMap[docId] = new Automerge.DocSet<SyncDoc>()
      }
      this.documentSetMap[docId].setDoc(docId, doc)
    } catch (e) {
      console.error(e, docId)
    }
  }

  /**
   * Remove document from Automerge DocSet
   */

  removeDocument = (docId: string) => {
    if (this.documentSetMap[docId]) {
      this.documentSetMap[docId].removeDoc(docId)
      delete this.documentSetMap[docId]
    }
  }

  /**
   * Remove client cursor data
   */

  garbageCursor = (docId: string, id: string) => {
    try {
      const doc = this.getDocument(docId)

      if (!doc || !doc.cursors) return

      const change = Automerge.change(doc, (d: any) => {
        delete d.cursors[id]
      })

      this.documentSetMap[docId].setDoc(docId, change)
    } catch (e) {
      console.error('Unexpected error in garbageCursor', e)
    }
  }
}

export default AutomergeBackend
