import Automerge from 'automerge'
import { Element, Node, Operation, Range } from 'slate'

export type SyncValue = Automerge.List<Node>

export type SyncDoc = Automerge.Doc<{ children: SyncValue; cursors: Cursors }>

export type CollabActionType = 'operation' | 'document'

export type CollabMap = { [key: string]: any }

export type CollabOperation =
  | Operation
  | Operation[]
  | ((map: CollabMap, doc: Element) => Operation)
  | ((map: CollabMap, doc: Element) => Operation[])

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
