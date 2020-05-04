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
 * Collaboration contains core methods for collaboration backend
 */

class CollaborationBackend {
  connections: Connections = {}

  docSet: Automerge.DocSet<SyncDoc> = new Automerge.DocSet()

  /**
   * Create Autmorge Connection
   */

  createConnection = (id: string, send: any) => {
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
    this.connections[id].close()

    delete this.connections[id]
  }

  /**
   * Receive and apply operation to Automerge Connection
   */

  receiveOperation = (id: string, data: CollabAction) =>
    this.connections[id].receiveMsg(data.payload)

  /**
   * Get document from Automerge DocSet
   */

  getDocument = (docId: string) => this.docSet.getDoc(docId)

  /**
   * Append document to Automerge DocSet
   */

  appendDocument = (docId: string, data: Element[]) => {
    const sync = toSync({ cursors: {}, children: data })

    const doc = Automerge.from<SyncDoc>(sync)

    this.docSet.setDoc(docId, doc)
  }

  /**
   * Remove document from Automerge DocSet
   */

  removeDocument = (docId: string) => this.docSet.removeDoc(docId)

  /**
   * Remove client cursor data
   */

  garbageCursor = (docId: string, id: string) => {
    const doc = this.getDocument(docId)

    if (!doc.cursors) return

    const change = Automerge.change(doc, d => {
      delete d.cursors[id]
    })

    this.docSet.setDoc(docId, change)
  }
}

export default CollaborationBackend