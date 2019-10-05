const Connection = require('@slate-collaborative/backend')
const defaultValue = require('./src/defaultValue')

const config = {
  port: 9000,
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
