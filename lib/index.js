'use strict'

const urlTool = require('url')
const http = require('http')
const https = require('https')
const JSONStream = require('JSONStream')

const doRequest = options => options.protocol.indexOf('https') !== -1
  ? https.request
  : http.request

module.exports = function requestGenerator ({request, pagination, pattern, transform}) {
  if (typeof request === 'string') {
    request = urlTool.parse(request)
  }
  const chunks = []
  var promise
  const req = doRequest(request, res => {
    const stream = res.pipe(JSONStream.parse(pattern))
    stream.on('data', data => {
      if (promise) {
        promise.resolve(data)
        promise = false
      } else {
        chunks.push(data)
      }
    })
  })
  console.log('yeah makin a generator lol')
  return function * gen () {
    yield 'lol'
  }
}
