export type CollabActionType = 'operation' | 'document'

export interface CollabAction {
  type: CollabActionType
  payload: any
}
