import React from 'react'

const renderAnnotation = ({ cursorAnnotationType, renderCursor }) => (
  props,
  editor,
  next
) => {
  const { children, annotation, attributes, node } = props

  if (annotation.type !== cursorAnnotationType) return next()

  const data = annotation.data.toJS()

  const { targetPath, alphaColor } = data
  const { document } = editor.value

  const targetNode = document.getNode(targetPath)
  const showCursor = targetNode && targetNode.key === node.key

  return (
    <span
      {...attributes}
      style={{ position: 'relative', background: alphaColor }}
    >
      {showCursor ? renderCursor(data) : null}
      {children}
    </span>
  )
}

export default renderAnnotation
