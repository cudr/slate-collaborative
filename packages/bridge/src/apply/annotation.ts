import { SyncDoc } from '../model/index'
import { toSync } from '../utils'
import {
  AddAnnotationOperation,
  RemoveAnnotationOperation,
  SetAnnotationOperation
} from 'slate'

export const addAnnotation = (
  doc: SyncDoc,
  op: AddAnnotationOperation
): SyncDoc => {
  if (!doc.annotations) {
    doc['annotations'] = {}
  }

  const annotation = op.annotation.toJSON()

  doc.annotations[annotation.key] = toSync(annotation)

  return doc
}

export const removeAnnotation = (
  doc: SyncDoc,
  op: RemoveAnnotationOperation
): SyncDoc => {
  if (doc.annotations) {
    delete doc.annotations[op.annotation.key]
  }

  return doc
}

export const setAnnotation = (
  doc: SyncDoc,
  op: SetAnnotationOperation
): SyncDoc => {
  /**
   * Looks like set_annotation option is broken, temporary disabled
   */

  // const { newProperties }: any = op.toJSON()

  // if (!doc.annotations || !newProperties) return doc

  // if (!doc.annotations[newProperties.key]) {
  //   return addAnnotation(doc, newProperties)
  // } else {
  //   doc.annotations[newProperties.key] = { ...doc.annotations[newProperties.key], ...newProperties }
  // }

  return doc
}

export default {
  add_annotation: addAnnotation,
  remove_annotation: removeAnnotation,
  set_annotation: setAnnotation
}
