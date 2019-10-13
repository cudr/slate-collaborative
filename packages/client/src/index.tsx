import onChange from './onChange'
import renderEditor from './renderEditor'
import renderAnnotation from './renderAnnotation'

import renderCursor from './renderCursor'

import { PluginOptions } from './model'

export const defaultOpts = {
  url: 'http://localhost:9000',
  cursorAnnotationType: 'collaborative_selection',
  renderCursor,
  annotationDataMixin: {
    name: 'an collaborator name',
    color: 'palevioletred',
    alphaColor: 'rgba(233, 30, 99, 0.2)'
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
