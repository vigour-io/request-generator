'use strict'

const urlTool = require('url')
const http = require('http')
const https = require('https')
const JSONStream = require('JSONStream')

const doRequest = (options, handler) => options.protocol.indexOf('https') !== -1
  ? https.request(options, handler)
  : http.request(options, handler)

// @TODO:
// - fix generator steez
// - handle POST payloads

module.exports = function requestGenerator ({request, pagination, pattern, transform, payload}) {
  if (typeof request === 'string') {
    request = urlTool.parse(request)
  }
  const chunks = []
  var ended
  var promise
  if (pagination) {
    if (pagination.totalPages) {
      // parallel

    } else {
      // serial
      const pageGenerator = makePageGenerator()
    }
    let handler = pagination.before || pagination
    handler(request, i)
  }



  const req = doRequest(request, res => {
    res.pipe(JSONStream.parse(pattern))
    .on('data', data => {
      if (promise) {
        promise.resolve(data)
        promise = false
      } else {
        chunks.push(data)
      }
    })
    .on('error', err => console.log(
      '\n------------ stream error!\n', err, '\n-----------'
    ))
    .on('end', () => ended = true)
  })
  .on('error', err => console.log(
    '\n------------ request error!\n', err, '\n-----------'
  ))
  if (payload) {
    req.write(payload)
  }
  req.end()
  console.log('yeah makin a generator lol')
  return function * gen () {
    if (chunks.length) {
      console.log('yield chunk')
      yield chunks.shift()
    } else if (!ended) {
      console.log('yield promise')
      yield new Promise((resolve, reject) => {
        promise = { resolve, reject }
      })
    }
  }
}

scrapeGenerator

pageGenerator

chunkGenerator

getEndpoint ({requestOptions, pagination, pattern, transform})

getPage ({requestOptions, pagination, pattern, transform})

getChunks



function makePageGenerator ({page, request, pagination, pattern, transform, payload}) {
  var i = 0
  return function * pageGenerator () {
    const chunkGenerator = makeChunks
    while (loadingPage) {
      yield getResponseChunk()
    }
  }
}
