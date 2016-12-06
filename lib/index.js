'use strict'

const urlTool = require('url')
const http = require('http')
const https = require('https')
const request = options => options.protocol.indexOf('https') !== -1 ? https.request : http


typeof opts === 'string'
  ? opts.indexOf('https') !== -1 ? https : http
  :
const JSONStream = require('JSONStream')

module.exports = function requestGenerator ({request, pagination, pattern, transform}) {
  if (typeof request === 'string') {
    request = urlTool.parse(request)
  }
  const req = request()
  console.log('yeah makin a generator lol')
  return function * gen () {
    yield 'lol'
  }
}
