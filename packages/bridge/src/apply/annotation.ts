import { Operation, SyncDoc } from '../model'

export const addAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  return doc
}

export const removeAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  return doc
}

export const setAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  return doc
}

export default {
  add_annotation: addAnnotation,
  remove_annotation: removeAnnotation,
  set_annotation: setAnnotation
}
