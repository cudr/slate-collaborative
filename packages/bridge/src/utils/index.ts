import toSync from './toSync'
import hexGen from './hexGen'

export * from './testUtils'

const toJS = (node: any) => {
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

const toCollabAction = (type: any, fn: any) => (payload: any) =>
  fn({ type, payload })

export { toSync, toJS, toSlatePath, hexGen, cloneNode, toCollabAction }
