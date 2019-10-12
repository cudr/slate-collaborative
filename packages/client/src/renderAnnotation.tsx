import React, { Fragment } from 'react'

const wrapStyles = {
  backgroundColor: 'rgba(233, 30, 99, 0.2)',
  position: 'relative'
}

const cursorStyleBase = {
  position: 'absolute',
  top: -2,
  pointerEvents: 'none',
  userSelect: 'none',
  transform: 'translateY(-100%)',
  fontSize: 10,
  color: 'white',
  background: 'palevioletred',
  whiteSpace: 'nowrap'
} as any

const caretStyleBase = {
  position: 'absolute',
  top: 0,
  pointerEvents: 'none',
  userSelect: 'none',
  height: '100%',
  width: 2,
  background: '#bf1b52'
}

const renderAnnotation = (props, editor, next) => {
  const { children, annotation, attributes, node } = props

  const isBackward = annotation.data.get('isBackward')
  const targetPath = annotation.data.get('targetPath')

  console.log(
    'renderAnnotation',
    annotation.toJS(),
    props,
    isBackward,
    targetPath
  )

  const badgeStyles = { ...cursorStyleBase, left: isBackward ? '0%' : '100%' }
  const caretStyles = { ...caretStyleBase, left: isBackward ? '0%' : '100%' }

  const { document } = editor.value

  const targetNode = document.getNode(targetPath)

  const isShowCursor = targetNode && targetNode.key === node.key

  switch (annotation.type) {
    case 'collaborative_selection':
      return (
        <span {...attributes} style={wrapStyles}>
          {isShowCursor ? (
            <Fragment>
              <span contentEditable={false} style={badgeStyles}>
                {annotation.key}
              </span>
              <span contentEditable={false} style={caretStyles} />
            </Fragment>
          ) : null}
          {children}
        </span>
      )
    default:
      return next()
  }
}

export default renderAnnotation
