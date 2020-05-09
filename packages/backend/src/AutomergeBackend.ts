import * as Automerge from 'automerge'

import { Element } from 'slate'

import {
  toCollabAction,
  toSync,
  SyncDoc,
  CollabAction
} from '@slate-collaborative/bridge'

export interface Connections {
  [key: string]: Automerge.Connection<SyncDoc>
}

/**
 * AutomergeBackend contains collaboration with Automerge
 */

class AutomergeBackend {
  connections: Connections = {}

  docSet: Automerge.DocSet<SyncDoc> = new Automerge.DocSet()

  /**
   * Create Autmorge Connection
   */

  createConnection = (id: string, send: any) => {
    if (this.connections[id]) {
      console.warn(
        `Already has connection with id: ${id}. It will be terminated before create new connection`
      )

      this.closeConnection(id)
    }

    this.connections[id] = new Automerge.Connection(
      this.docSet,
      toCollabAction('operation', send)
    )
  }

  /**
   * Start Automerge Connection
   */

  openConnection = (id: string) => this.connections[id].open()

  /**
   * Close Automerge Connection and remove it from connections
   */

  closeConnection(id: string) {
    this.connections[id]?.close()

    delete this.connections[id]
  }

  /**
   * Receive and apply operation to Automerge Connection
   */

  receiveOperation = (id: string, data: CollabAction) => {
    try {
      this.connections[id].receiveMsg(data.payload)
    } catch (e) {
      console.error('Unexpected error in receiveOperation', e)
    }
  }

  /**
   * Get document from Automerge DocSet
   */

  getDocument = (docId: string) => this.docSet.getDoc(docId)

  /**
   * Append document to Automerge DocSet
   */

  appendDocument = (docId: string, data: Element[]) => {
    try {
      if (this.getDocument(docId)) {
        throw new Error(`Already has document with id: ${docId}`)
      }

      const sync = toSync({ cursors: {}, children: data })

      const doc = Automerge.from<SyncDoc>(sync)

      this.docSet.setDoc(docId, doc)
    } catch (e) {
      console.error(e, docId)
    }
  }

  /**
   * Remove document from Automerge DocSet
   */

  removeDocument = (docId: string) => this.docSet.removeDoc(docId)

  /**
   * Remove client cursor data
   */

  garbageCursor = (docId: string, id: string) => {
    try {
      const doc = this.getDocument(docId)

      if (!doc.cursors) return

      const change = Automerge.change(doc, d => {
        delete d.cursors[id]
      })

      this.docSet.setDoc(docId, change)
    } catch (e) {
      console.error('Unexpected error in garbageCursor', e)
    }
  }
}

export default AutomergeBackend
