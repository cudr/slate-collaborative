import * as Automerge from 'automerge'
import { ValueJSON, TextJSON, NodeJSON } from 'slate'

export const createTextJSON = (text: string = ''): TextJSON => ({
  object: 'text',
  marks: [],
  text
})

export const createBlockJSON = (
  type: string = 'paragraph',
  text: string = ''
): NodeJSON => ({
  object: 'block',
  type,
  nodes: [createTextJSON(text)]
})

export const createValueJSON = (): ValueJSON => ({
  document: {
    nodes: [createBlockJSON()]
  }
})

export const createDoc = () => Automerge.from(createValueJSON())

export const cloneDoc = doc => Automerge.change(doc, '', d => d)
