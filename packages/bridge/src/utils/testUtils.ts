import * as Automerge from 'automerge'

import { Node } from 'slate'

export const createTextJSON = (text: string = '') => ({
  text
})

export const createBlockJSON = (
  type: string = 'paragraph',
  text: string = ''
) => ({
  type,
  children: [createTextJSON(text)]
})

export const createValueJSON = (): { children: Node[] } => ({
  children: [createBlockJSON()]
})

export const createDoc = () => Automerge.from(createValueJSON())

export const cloneDoc = (doc: any) => Automerge.change(doc, '', d => d)
