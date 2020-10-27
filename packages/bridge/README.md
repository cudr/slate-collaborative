# slate-sheikah.
slatejs collaborative plugin &amp; microservice
Forked from ([slate-collaborative](https://github.com/cudr/slate-collaborative) and modified for speed and stability.

## [demo](https://slate-sheikah.herokuapp.com/)
![screencast2019-10-2820-06-10](https://user-images.githubusercontent.com/23132107/67700384-ebff7280-f9be-11e9-9005-6ddadcafec47.gif)

# API

## Client

Use it as a simple slatejs plugin

```ts
import { withIOCollaboration } from '@slate-sheikah/client'

const collaborationEditor = withIOCollaboration(editor, options)
```

Check [detailed example](https://github.com/docket-hq/slate-sheikah/blob/master/packages/example/src/Client.tsx)

### Options:
```ts
{
  docId?: // document id
  url?: string // url to open connection
  connectOpts?: SocketIOClient.ConnectOpts // socket.io-client options
  cursorData?: any // any data passed to cursor
  onConnect?: () => void // connect callback
  onDisconnect?: () => void // disconnect callback
  onError?: (reason: string) => void // error callback
  preserveExternalHistory?: boolean // preserve slate-history operations form other clients
}
```

You need to attach the useCursor decorator to provide custom cursor data in renderLeaf function

```ts
import { useCursor } from '@slate-sheikah/client'

const decorator = useCursor(editor)
```



## Backend
```ts
const { SocketIOConnection } = require('@slate-sheikah/backend')

const connection = new SocketIOConnection(options)
```

### options:
```ts
{
  entry: Server // or specify port to start io server
  defaultValue: Node[] // default value
  saveFrequency: number // frequency of onDocumentSave callback execution in ms
  onAuthRequest: ( // auth callback
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad: ( // request slate document callback
    pathname: string,
    query?: Object
  ) => Promise<Node[]> | Node[]
  onDocumentSave: (pathname: string, doc: Node[]) => Promise<void> | void // save document callback
}
```

# Contribute

You welcome to contribute!

start it ease:
```
yarn
yarn dev
```
# Credits
  [cudr](https://github.com/cudr)
  [slate-collaborative](https://github.com/cudr/slate-collaborative)
  [slate-automerge](https://github.com/humandx/slate-automerge)
