import toSync from './toSync'
import hexGen from './hexGen'

import { CollabAction } from '../model'

export * from './testUtils'

const toJS = (node: any) => JSON.parse(JSON.stringify(node))

const cloneNode = (node: any) => toSync(toJS(node))

const toSlatePath = (path: any) =>
  path ? path.filter((d: any) => Number.isInteger(d)) : []

const toCollabAction = (type: any, fn: (action: CollabAction) => void) => (
  payload: any
) => fn({ type, payload })

export { toSync, toJS, toSlatePath, hexGen, cloneNode, toCollabAction }
