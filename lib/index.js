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
    if (typeof request === 'string') {
      request = urlTool.parse(request)
    }
    let stopped
    while (!stopped) {
      let chunkCount = 0
      let chunks = chunkGenerator(request, stream, transform)
       for (let chunk of chunks) {
        chunkCount++
        yield chunk
      }
      if (done) {
        let err = null
        let result = done(err, request, chunkCount)
        if (result) {
          if (result instanceof Promise) {
            yield result.then((val) => {
              if (val) {
                stopped = val.done
                return val.value
              }
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

function * chunkGenerator (request, stream, transform) {
  let chunks = []
  let promise
  let ended
  const req = reqLibs[request.protocol].request(request, res => {
    res.pipe(JSONStream.parse(stream))
    .on('data', chunk => {
      if (transform) {
        chunk = transform(chunk)
      }
      if (promise) {
        promise.resolve(chunk)
        promise = false
      } else {
        chunks.push(chunk)
      }
    })
    .on('end', () => {
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
  let payload = request.payload
  if (payload) {
    req.write(payload)
  }
  req.end()
  while (chunks.length || !ended) {
    if (chunks.length) {
      yield chunks.shift()
    } else {
      if (promise) {
        throw new Error('cannot yield next promise before previous is resolved!')
      } else {
        yield new Promise((resolve, reject) => {
          promise = { resolve, reject }
        })
      }
    }
  }
}
