import React, { Component } from 'react'
import faker from 'faker'

import styled from '@emotion/styled'

import Room from './Room'

class App extends Component<{}, { rooms: string[] }> {
  state = {
    rooms: []
  }

  componentDidMount() {
    this.addRoom()
  }

  render() {
    const { rooms } = this.state

    return (
      <Container>
        <AddButton type="button" onClick={this.addRoom}>
          Add Room
        </AddButton>
        {rooms.map(room => (
          <Room key={room} slug={room} removeRoom={this.removeRoom(room)} />
        ))}
      </Container>
    )
  }

  addRoom = () => {
    const room = faker.lorem.slug(4)

    this.setState({ rooms: [...this.state.rooms, room] })
  }

  removeRoom = (room: string) => () => {
    this.setState({
      rooms: this.state.rooms.filter(r => r !== room)
    })
  }
}

export default App

const Container = styled.div``

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
  margin-left: 30px;
  color: violet;
  border: 2px solid violet;
`
