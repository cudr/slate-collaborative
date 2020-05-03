export const getClients = (io: SocketIO.Server, nsp: string) =>
  new Promise((r, j) => {
    io.of(nsp).clients((e: any, c: any) => (e ? j(e) : r(c)))
  })
