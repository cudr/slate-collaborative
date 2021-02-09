import toSync from './toSync'
import hexGen from './hexGen'

import { CollabAction } from '../model'

export * from './testUtils'

const toJS = (node: any) => {
  if (node === undefined) {
    return undefined
  }
  try {
    return JSON.parse(JSON.stringify(node))
  } catch (e) {
    console.error('Convert to js failed!!! Return null')
    return null
  }
}

const cloneNode = (node: any) => toSync(toJS(node))

const toSlatePath = (path: any) =>
  path ? path.filter((d: any) => Number.isInteger(d)) : []

const toCollabAction = (type: any, fn: (action: CollabAction) => void) => (
  payload: any
) => fn({ type, payload })

export { toSync, toJS, toSlatePath, hexGen, cloneNode, toCollabAction }
