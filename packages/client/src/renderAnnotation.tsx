import React, { Fragment } from 'react'

const wrapStyles = {
  background: 'rgba(233, 30, 99, 0.2)',
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
  background: 'palevioletred'
} as any

const renderAnnotation = ({
  cursorAnnotationType,
  renderCursor,
  cursorStyle = {},
  caretStyle = {},
  selectionStyle = {}
}) => (props, editor, next) => {
  const { children, annotation, attributes, node } = props

  if (annotation.type !== cursorAnnotationType) return next()

  const isBackward = annotation.data.get('isBackward')
  const targetPath = annotation.data.get('targetPath')
  const cursorText = renderCursor(annotation.data)

  const cursorStyles = {
    ...cursorStyleBase,
    ...cursorStyle,
    left: isBackward ? '0%' : '100%'
  }
  const caretStyles = {
    ...caretStyleBase,
    ...caretStyle,
    left: isBackward ? '0%' : '100%'
  }

  const { document } = editor.value

  const targetNode = document.getNode(targetPath)
  const isShowCursor = targetNode && targetNode.key === node.key

  return (
    <span {...attributes} style={{ ...wrapStyles, ...selectionStyle }}>
      {isShowCursor ? (
        <Fragment>
          <span contentEditable={false} style={cursorStyles}>
            {cursorText}
          </span>
          <span contentEditable={false} style={caretStyles} />
        </Fragment>
      ) : null}
      {children}
    </span>
  )
}

export default renderAnnotation
