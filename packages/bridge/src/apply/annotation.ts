import { Operation, SyncDoc } from '../model'

export const addAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  console.log('addAnnotation!!!', op.toJS())
  return doc
}

export const removeAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  console.log('removeAnnotation!!!', op.toJS())
  return doc
}

export const setAnnotation = (doc: SyncDoc, op: Operation): SyncDoc => {
  console.log('setAnnotation!!!', op.toJS())
  return doc
}

export default {
  add_annotation: addAnnotation,
  remove_annotation: removeAnnotation,
  set_annotation: setAnnotation
}
