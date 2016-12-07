'use strict'

const urlTool = require('url')
const http = require('http')
const https = require('https')
const JSONStream = require('JSONStream')

const reqLibs = {
  'http:': http,
  'https:': https
}

module.exports = function requestGenerator (request, stream, transform, done) {
  return function * () {
    var payload
    if (typeof request === 'string') {
      request = urlTool.parse(request)
    } else {
      payload = request.payload
    }
    let stopped
    while (!stopped) {
      let chunkCount = 0
      let chunks = chunkGenerator({ request, payload, stream, transform })

      // other way arround as well
      // not good
      for (let chunk of chunks) { // also not good
        chunkCount++
        // if (transform) {
        //   yield transform(chunk)
        // } else {
        yield chunk
        // }
      }
      if (done) {
        let err = null
        let result = done(err, chunkCount, request)
        if (result) {
          if (result instanceof Promise) {
            yield result.then(({value, done}) => {
              stopped = done
              return value
            })
          } else {
            stopped = result.done
            if ('value' in result) {
              yield result.value
            }
          }
        }
      } else {
        stopped = true
      }
    }
  }
}

function * chunkGenerator ({request, payload, stream, transform}) {
  let chunks = []
  let promise
  let ended
  const req = reqLibs[request.protocol].request(request, res => {
    res.pipe(JSONStream.parse(stream))
    .on('data', chunk => {
      if (promise) {
        promise.resolve(transform ? transform(chunk) : chunk)
        promise = false
      } else {
        chunks.push(transform ? transform(chunk) : chunk)
      }
    })
    .on('end', () => {
      console.log('> stream end')
      ended = true
      if (promise) {
        promise.reject()
      }
    })
    .on('error', err => {
      console.log('stream error :(')
      throw err
    })
  })
  .on('error', err => {
    console.log('request error :(')
    throw err
  })
  if (payload) {
    req.write(payload)
  }
  req.end()
  while (chunks.length || !ended) {
    if (chunks.length) {
      console.log('have chunk ready, lets yield it')
      yield chunks.shift()
    } else {
      if (promise) {
        throw new Error('cannot yield next promise before previous is resolved!')
      } else {
        console.log('no chunks yet, yield a promise')
        yield new Promise((resolve, reject) => {
          promise = { resolve, reject }
        })
      }
    }
  }
}
