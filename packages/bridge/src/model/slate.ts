import { Operation, NodeJSON } from 'slate'
import { List } from 'immutable'

export type Operations = List<Operation>
export type SyncNode = NodeJSON
export type Path = List<number>

export { Operation }
