import toSync from './toSync'

export const toJS = node => JSON.parse(JSON.stringify(node))

export const cloneNode = node => toSync(toJS(node))

const toSlatePath = path => (path ? path.filter(d => Number.isInteger(d)) : [])

export { toSync, toSlatePath }
