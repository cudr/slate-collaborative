export type CollabActionType = 'operation' | 'document'

export interface CollabAction {
  type: CollabActionType
  payload: any
}

export interface CursorData {
  [key: string]: any
}
