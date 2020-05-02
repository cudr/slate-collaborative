import defaultValue from './defaultValue'

export const getClients = (io: SocketIO.Server, nsp: string) =>
  new Promise((r, j) => {
    io.of(nsp).clients((e: any, c: any) => (e ? j(e) : r(c)))
  })

export const defaultOptions = {
  entry: 9000,
  saveFrequency: 2000
}

export { defaultValue }
