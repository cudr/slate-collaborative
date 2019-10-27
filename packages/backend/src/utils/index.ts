import defaultValue from './defaultValue'

export const getClients = (io, nsp) =>
  new Promise((r, j) => {
    io.of(nsp).clients((e, c) => (e ? j(e) : r(c)))
  })

export const defaultOptions = {
  entry: 9000,
  saveTreshold: 2000,
  cursorAnnotationType: 'collaborative_selection'
}

export { defaultValue }
