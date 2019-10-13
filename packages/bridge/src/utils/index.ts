import toSync from './toSync'
import hexGen from './hexGen'

export const toJS = node => {
  try {
    return JSON.parse(JSON.stringify(node))
  } catch (e) {
    console.error('Convert to js failed!!! Return null')
    return null
  }
}

export const cloneNode = node => toSync(toJS(node))

const toSlatePath = path => (path ? path.filter(d => Number.isInteger(d)) : [])

export { toSync, toSlatePath, hexGen }
