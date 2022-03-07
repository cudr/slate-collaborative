import AutomergeBackend from '../AutomergeBackend'

/**
 * Get the number of active connections for the specified docId
 */
const getActiveConnections = (backend: AutomergeBackend, docId: string) => {
  const automergeDocument = backend.documentSetMap[docId]

  if (!automergeDocument) return 0

  // This is the only way to synchronously check the number of active Automerge.Connections
  // for this docId.
  // @ts-ignore
  return automergeDocument.handlers.size
}

export default getActiveConnections
