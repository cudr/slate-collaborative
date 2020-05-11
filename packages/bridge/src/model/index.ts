import Automerge from 'automerge'
import { Node, Range } from 'slate'

export type SyncValue = Automerge.List<Node[]>

export type SyncDoc = Automerge.Doc<{ children: SyncValue; cursors: Cursors }>

export type CollabActionType = 'operation' | 'document'

export interface CollabAction {
  type: CollabActionType
  payload: any
}

export interface CursorData {
  [key: string]: any
}

export interface Cursor extends Range, CursorData {
  isForward: boolean
}

export type Cursors = {
  [key: string]: Cursor
}
