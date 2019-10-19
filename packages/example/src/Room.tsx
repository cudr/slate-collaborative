import React, { Component, ChangeEvent } from 'react'
import faker from 'faker'
import debounce from 'lodash/debounce'

import { RoomWrapper, H4, Title, Button, Grid, Input } from './elements'

import Client from './Client'

interface User {
  id: string
  name: string
}

interface RoomProps {
  slug: string
  removeRoom: () => void
}

interface RoomState {
  users: User[]
  slug: string
  rebuild: boolean
}

class Room extends Component<RoomProps, RoomState> {
  state = {
    users: [],
    slug: this.props.slug,
    rebuild: false
  }

  componentDidMount() {
    this.addUser()
    setTimeout(this.addUser, 10)
  }

  render() {
    const { users, slug, rebuild } = this.state

    return (
      <RoomWrapper>
        <Title>
          <H4>Document slug:</H4>
          <Input type="text" value={slug} onChange={this.changeSlug} />
          <Button type="button" onClick={this.addUser}>
            Add random user
          </Button>
          <Button type="button" onClick={this.props.removeRoom}>
            Remove Room
          </Button>
        </Title>
        <Grid>
          {users.map(
            (user: User) =>
              !rebuild && (
                <Client
                  {...user}
                  slug={slug}
                  key={user.id}
                  removeUser={this.removeUser}
                />
              )
          )}
        </Grid>
      </RoomWrapper>
    )
  }

  addUser = () => {
    const user = {
      id: faker.random.uuid(),
      name: `${faker.name.firstName()} ${faker.name.lastName()}`
    }

    this.setState({ users: [...this.state.users, user] })
  }

  removeUser = (userId: string) => {
    this.setState({
      users: this.state.users.filter((u: User) => u.id !== userId)
    })
  }

  changeSlug = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ slug: e.target.value }, this.rebuildClient)
  }

  rebuildClient = debounce(() => {
    this.setState({ rebuild: true }, () => this.setState({ rebuild: false }))
  }, 300)
}

export default Room
