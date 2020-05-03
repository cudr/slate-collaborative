const { SocketIOCollaboration } = require('@slate-collaborative/backend')
const express = require('express')

const defaultValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'Hello collaborator!'
      }
    ]
  }
]

const PORT = process.env.PORT || 9000

const server = express()
  .use(express.static('build'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const config = {
  entry: server, // or specify port to start io server
  defaultValue,
  saveFrequency: 2000,
  onAuthRequest: async (query, socket) => {
    // some query validation
    return true
  },
  onDocumentLoad: async pathname => {
    // request initial document ValueJSON by pathnme
    return defaultValue
  },
  onDocumentSave: async (pathname, doc) => {
    // save document
    console.log('onDocumentSave', pathname, doc)
  }
}

const connection = new SocketIOCollaboration(config)
