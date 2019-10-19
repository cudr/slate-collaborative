import toSync from './toSync'
import hexGen from './hexGen'

const toJS = node => {
  try {
    return JSON.parse(JSON.stringify(node))
  } catch (e) {
    console.error('Convert to js failed!!! Return null')
    return null
  }
}

const cloneNode = node => toSync(toJS(node))

const toSlatePath = path => (path ? path.filter(d => Number.isInteger(d)) : [])

export { toSync, toJS, toSlatePath, hexGen, cloneNode }
