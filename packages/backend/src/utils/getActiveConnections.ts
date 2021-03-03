import AutomergeBackend from '../AutomergeBackend'

const getActiveConnections = (backend: AutomergeBackend, docId: string) => {
  // This is the only way to synchronously check the number of active Automerge.Connections
  // for this docId.
  // @ts-ignore
  const activeConnectionsCount = backend.documentSetMap[docId]?.handlers.size

  return activeConnectionsCount
}

export default getActiveConnections
