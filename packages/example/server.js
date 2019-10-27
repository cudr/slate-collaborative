const Connection = require('@slate-collaborative/backend')
const defaultValue = require('./src/defaultValue')
const express = require('express')

const app = express()

const server = require('http').createServer(app)

const PORT = process.env.PORT || 9000

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

app.use(express.static('build'))

server.listen(PORT)
