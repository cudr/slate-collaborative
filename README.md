# slate-collaborative
slatejs collaborative plugin &amp; microservice

A little experiment for co-editing.

Based on idea of https://github.com/humandx/slate-automerge

Watch the demo


# API

## Client

Use it as a simple slatejs plugin

check [example](https://github.com/cudr/slate-collaborative/blob/master/packages/example/src/Client.tsx)

```
import ColaborativeClient from '@slate-collaborative/client'

const plugins = [ColaborativeClient(options)]
```

### options:
```
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
```
const CollaborativeBackend = require('@slate-collaborative/backend')

const connection = new CollaborativeBackend(options)
```

### options:
```
{
  port: number // posrt to start io connection
  connectOpts?: SocketIO.ServerOptions
  defaultValue?: ValueJSON // default value
  saveTreshold?: number // theshold of onDocumentSave callback execution
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

