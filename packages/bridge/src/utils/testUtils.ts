import * as Automerge from 'automerge'
import { ValueJSON, TextJSON, NodeJSON } from 'slate'

export const createTextJSON = (text: string = ''): TextJSON => ({
  object: 'text',
  marks: [],
  text
})

export const createParagraphJSON = (text: string = ''): NodeJSON => ({
  object: 'block',
  type: 'paragraph',
  nodes: [createTextJSON(text)]
})

export const createValueJSON = (): ValueJSON => ({
  document: {
    nodes: [createParagraphJSON()]
  }
})

export const createDoc = () => Automerge.from(createValueJSON())

export const cloneDoc = doc => Automerge.change(doc, '', d => d)
