import React from 'react'

import { PluginOptions } from './index'

import Controller from './Controller'

const renderEditor = (opts: PluginOptions) => (
  props: any,
  editor: any,
  next: any
) => {
  const children = next()

  return (
    <Controller {...opts} editor={editor}>
      {children}
    </Controller>
  )
}

export default renderEditor
