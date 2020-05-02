import Automerge from 'automerge'
import { Node } from 'slate'

export type SyncDoc = Automerge.Doc<Node>

export type CollabActionType = 'operation' | 'document'

export interface CollabAction {
  type: CollabActionType
  payload: any
}

export interface CursorData {
  [key: string]: any
}
