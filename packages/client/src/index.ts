import onChange from './onChange'
import renderEditor from './renderEditor'
import renderAnnotation from './renderAnnotation'

import { PluginOptions } from './model'

export const defaultOpts = {
  url: 'http://localhost:9000',
  cursorAnnotationType: 'collaborative_selection',
  annotationDataMixin: {
    name: 'an collaborator'
  },
  renderCursor: data => data.name,
  cursorStyle: {
    background: 'palevioletred'
  },
  caretStyle: {
    background: 'palevioletred'
  },
  selectionStyle: {
    background: 'rgba(233, 30, 99, 0.2)'
  }
}

const plugin = (opts: PluginOptions = defaultOpts) => {
  const options = { ...defaultOpts, ...opts }

  return {
    onChange: onChange(options),
    renderEditor: renderEditor(options),
    renderAnnotation: renderAnnotation(options)
  }
}

export default plugin
