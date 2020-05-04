import * as Automerge from 'automerge'

import { toSync } from '../'

import { Node } from 'slate'

export const createText = (text: string = '') => ({
  text
})

export const createNode = (
  type: string = 'paragraph',
  text: string = '',
  data?: { [key: string]: any }
) => ({
  type,
  children: [createText(text)],
  ...data
})

export const createValue = (children?: any): { children: Node[] } => ({
  children: children || [createNode()]
})

export const createDoc = (children?: any) =>
  Automerge.from(toSync(createValue(children)))

export const cloneDoc = (doc: any) => Automerge.change(doc, '', d => d)
