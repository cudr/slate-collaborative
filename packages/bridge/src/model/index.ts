import Automerge from 'automerge'
import { Node, Range } from 'slate'

export type SyncDoc = Automerge.Doc<Node & Cursors>

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

export interface Cursors {
  [key: string]: Cursor
}
