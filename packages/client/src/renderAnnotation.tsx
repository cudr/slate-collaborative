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
  const { children, annotation, attributes } = props

  const isLeft = annotation.focus.offset >= annotation.anchor.offset

  console.log('isLeft', isLeft)

  const cursorStyles = { ...cursorStyleBase, left: isLeft ? '0%' : '100%' }

  console.log('renderAnnotation', annotation.toJSON())

  switch (annotation.type) {
    case 'collaborative_selection':
      return (
        <span {...attributes} style={wrapStyles}>
          <span contentEditable={false} style={cursorStyles}>
            {annotation.key}
          </span>
          {children}
        </span>
      )
    default:
      return next()
  }
}

export default renderAnnotation
