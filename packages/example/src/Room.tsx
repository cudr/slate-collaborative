import React, { useState, ChangeEvent } from 'react'

import faker from 'faker'
import debounce from 'lodash/debounce'

import { RoomWrapper, H4, Title, Button, Grid, Input } from './Components'

import Client from './Client'

interface User {
  id: string
  name: string
}

interface RoomProps {
  slug: string
  removeRoom: () => void
}

const createUser = (): User => ({
  id: faker.random.uuid(),
  name: `${faker.name.firstName()} ${faker.name.lastName()}`
})

const Room: React.FC<RoomProps> = ({ slug, removeRoom }) => {
  const [users, setUsers] = useState<User[]>([createUser(), createUser()])
  const [roomSlug, setRoomSlug] = useState<string>(slug)
  const [isRemounted, setRemountState] = useState(false)

  const remount = debounce(() => {
    setRemountState(true)
    setTimeout(setRemountState, 50, false)
  }, 300)

  const changeSlug = (e: ChangeEvent<HTMLInputElement>) => {
    setRoomSlug(e.target.value)
    remount()
  }

  const addUser = () => setUsers(users => users.concat(createUser()))

  const removeUser = (userId: string) =>
    setUsers(users => users.filter((u: User) => u.id !== userId))

  return (
    <RoomWrapper>
      <Title>
        <H4>Document slug:</H4>
        <Input type="text" value={roomSlug} onChange={changeSlug} />
        <Button type="button" onClick={addUser}>
          Add random user
        </Button>
        <Button type="button" onClick={removeRoom}>
          Remove Room
        </Button>
      </Title>
      <Grid>
        {users.map((user: User) =>
          isRemounted ? null : (
            <Client
              {...user}
              slug={roomSlug}
              key={user.id}
              removeUser={removeUser}
            />
          )
        )}
      </Grid>
    </RoomWrapper>
  )
}

export default Room
