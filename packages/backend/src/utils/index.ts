import defaultValue from './defaultValue'

export const getClients = (io: any, nsp: string) =>
  new Promise((r, j) => {
    io.of(nsp).clients((e: any, c: any) => (e ? j(e) : r(c)))
  })

export const defaultOptions = {
  entry: 9000,
  saveTreshold: 2000
}

export { defaultValue }
