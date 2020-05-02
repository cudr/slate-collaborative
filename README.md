# slate-collaborative. Check [Demo](https://slate-collaborative.herokuapp.com/)
slatejs collaborative plugin &amp; microservice

![screencast2019-10-2820-06-10](https://user-images.githubusercontent.com/23132107/67700384-ebff7280-f9be-11e9-9005-6ddadcafec47.gif)

A little experiment for co-editing.

Based on idea of https://github.com/humandx/slate-automerge

# API

## Client

Use it as a simple slatejs plugin

check [example](https://github.com/cudr/slate-collaborative/blob/221d8929915c49cbe30a2f92550c9a604b9a527e/packages/example/src/Client.tsx#L43)

```ts
import ColaborativeClient from '@slate-collaborative/client'

const plugins = [ColaborativeClient(options)]
```

### options:
```ts
{
  url?: string // url to open connection
  connectOpts?: SocketIOClient.ConnectOpts // socket.io-client options
  cursorAnnotationType?: string // type string for cursor annotations
  annotationDataMixin?: Data // any data passed to cursor annotation
  renderPreloader?: () => ReactNode // optional preloader render
  renderCursor?: (data: Data) => ReactNode | any // custom cursor render
  onConnect?: (connection: Connection) => void // connect callback
  onDisconnect?: (connection: Connection) => void // disconnect callback
}
```

## Backend
```ts
const CollaborativeBackend = require('@slate-collaborative/backend')

const connection = new CollaborativeBackend(options)
```

### options:
```ts
{
  entry: number | Server // port or Server for listen io connection
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: ValueJSON // default value
  saveFrequency?: number // frequency of onDocumentSave callback execution
  cursorAnnotationType?: string // type string for cursor annotations
  onAuthRequest?: ( // auth callback
    query: Object,
    socket?: SocketIO.Socket
  ) => Promise<boolean> | boolean
  onDocumentLoad?: ( // request slatejs document callback
    pathname: string,
    query?: Object
  ) => ValueJSON | null | false | undefined
  onDocumentSave?: (pathname: string, json: ValueJSON) => Promise<void> | void // save document callback 
}
```

# Contribute

You welcome to contribute!

start it ease:
```
yarn
yarn dev
```

