import React from 'react'

const wrapStyles = { backgroundColor: '#e91e63', position: 'relative' }

const cursorStyleBase = {
  position: 'absolute',
  top: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  transform: 'translateY(-100%)',
  fontSize: '10px',
  color: 'white',
  background: 'palevioletred',
  whiteSpace: 'nowrap'
} as any

const renderAnnotation = (props, editor, next) => {
  const { children, annotation, attributes, node } = props

  const isBackward = annotation.data.get('isBackward')
  const cursorPath = isBackward ? annotation.anchor.path : annotation.focus.path

  console.log('renderAnnotation', props, isBackward, cursorPath)

  const cursorStyles = { ...cursorStyleBase, left: isBackward ? '0%' : '100%' }

  const { document } = editor.value

  const targetNode = document.getNode(cursorPath)

  const isTarget = targetNode && targetNode.key === node.key

  console.log('isTarget', isTarget, targetNode, node)
  const showCursor = isTarget

  switch (annotation.type) {
    case 'collaborative_selection':
      return (
        <span {...attributes} style={wrapStyles}>
          {showCursor ? (
            <span contentEditable={false} style={cursorStyles}>
              {annotation.key}
            </span>
          ) : null}
          {children}
        </span>
      )
    default:
      return next()
  }
}

export default renderAnnotation
