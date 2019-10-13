import React, { Fragment } from 'react'

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

const Cursor = ({ color, isBackward, name }) => {
  const cursorStyles = {
    ...cursorStyleBase,
    background: color,
    left: isBackward ? '0%' : '100%'
  }
  const caretStyles = {
    ...caretStyleBase,
    background: color,
    left: isBackward ? '0%' : '100%'
  }

  return (
    <Fragment>
      <span contentEditable={false} style={cursorStyles}>
        {name}
      </span>
      <span contentEditable={false} style={caretStyles} />
    </Fragment>
  )
}

export default Cursor
