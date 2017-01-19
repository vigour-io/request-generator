'use strict'

const urlTool = require('url')
const http = require('http')
const https = require('https')
const JSONStream = require('JSONStream')

const printError = require('./print-error')

const reqLibs = {
  'http:': http,
  'https:': https
}

process.on('unhandledRejection', r => {
  printError(r)
  throw r
})

module.exports = function * requestGenerator ({request, stream, transform, done}) {
  if (typeof request === 'string') {
    request = urlTool.parse(request)
  }
  var stopped
  while (!stopped) {
    let error = null
    let chunkCount = 0
    let chunks = chunkGenerator(request, stream, transform)
    for (let chunk of chunks) {
      chunkCount++
      if (chunk instanceof Promise) {
        chunk.catch(err => { error = err })
      }
      yield chunk
    }
    if (done) {
      let result = done(error, request, chunkCount)
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

function * chunkGenerator (request, stream, transform) {
  let chunks = []
  let promise
  let ended
  const req = reqLibs[request.protocol].request(request, res => {
    const resOk = res.statusCode < 300
    if (resOk && stream) {
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
        ended = true
        err.type = 'stream'
        err.request = request
        err.name = `(Stream error): ${err.name}`
        if (promise) {
          promise.reject(err)
        } else {
          chunks.push(Promise.reject(err))
        }
        // console.log('stream error!', err)
      })
    } else {
      let resData = ''
      res.on('data', chunk => {
        resData += chunk
      })
      res.on('end', () => {
        ended = true
        if (resOk) {
          if (transform) {
            resData = transform(resData)
          }
          if (promise) {
            promise.resolve(resData)
          } else {
            chunks.push(resData)
          }
        } else {
          let error = new Error('Error Response')
          error.type = 'response'
          error.request = request
          error.response = res
          error.data = resData
          if (promise) {
            promise.reject(error)
          } else {
            chunks.push(Promise.reject(error))
          }
        }
      })
    }
  })
  .on('error', err => {
    ended = true
    err.type = 'request'
    err.request = request
    if (promise) {
      promise.reject(err)
    } else {
      chunks.push(Promise.reject(err))
    }
  })
  let payload = request.payload
  if (payload) {
    req.write(payload)
  }
  req.end()
  while (chunks.length || !ended) { // eslint-disable-line
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
