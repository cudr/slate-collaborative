import React, { useState, useEffect } from 'react'
import faker from 'faker'

import styled from '@emotion/styled'

import Room from './Room'

const App = () => {
  const [rooms, setRooms] = useState<string[]>([])

  const addRoom = () => setRooms(rooms.concat(faker.lorem.slug(4)))

  const removeRoom = (room: string) => () =>
    setRooms(rooms.filter(r => r !== room))

  useEffect(() => {
    addRoom()
  }, [])

  return (
    <div>
      <Panel>
        <AddButton type="button" onClick={addRoom}>
          Add Room
        </AddButton>
      </Panel>
      {rooms.map(room => (
        <Room key={room} slug={room} removeRoom={removeRoom(room)} />
      ))}
    </div>
  )
}

export default App

const Panel = styled.div`
  display: flex;
`

const Button = styled.button`
  padding: 6px 14px;
  display: block;
  outline: none;
  font-size: 14px;
  max-width: 200px;
  text-align: center;
  color: palevioletred;
  border: 2px solid palevioletred;
`

const AddButton = styled(Button)`
  margin-left: 0px;
  color: violet;
  margin-bottom: 10px;
  border: 2px solid violet;
`
