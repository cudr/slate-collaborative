import * as Automerge from 'automerge'
import { TextJSON } from 'slate'

export const createTextJSON = (text: string = ''): TextJSON => ({
  object: 'text',
  marks: [],
  text
})

export const createBlockJSON = (
  type: string = 'paragraph',
  text: string = ''
) => ({
  object: 'block',
  type,
  nodes: [createTextJSON(text)]
})

export const createValueJSON = () => ({
  document: {
    nodes: [createBlockJSON()]
  }
})

export const createDoc = () => Automerge.from(createValueJSON())

export const cloneDoc = doc => Automerge.change(doc, '', d => d)
