const Connection = require('@slate-collaborative/backend')
const defaultValue = require('./src/defaultValue')
const server = require('http').createServer()

const config = {
  entry: server, // or specify port to start io server
  defaultValue,
  saveTreshold: 2000,
  onAuthRequest: async (query, socket) => {
    // some query validation
    return true
  },
  onDocumentLoad: async pathname => {
    // return initial document ValueJSON by pathnme
    return defaultValue
  },
  onDocumentSave: async (pathname, document) => {
    // save document
  }
}

const connection = new Connection(config)

server.listen(9000)
