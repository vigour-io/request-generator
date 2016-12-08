'use strict'

const test = require('tape')

const server = require('./server')
server.listen(4444)

test('basics - make a request generator', t => {
  const pageSize = 10
  const requestGenerator = require('../')
  let page = 0
  const request = 'http://localhost:4444/shows?page=0&size=10'
  const endpoint = requestGenerator({
    request,
    stream: 'results.*',
    done: (err, request, chunkCount) => {
      if (err) {
        console.log('errors during this request:', err)
      }
      if (chunkCount !== pageSize) {
        return { done: true } // @NOTE: could also reset page count here
      } else {
        request.path = `/shows?page=${++page}&size=10`
      }
    }
  })
  const totalShows = 100
  let consumedShows = 0
  consume(endpoint)

  function consume (chunks) {
    let step = chunks.next()
    if (!step.done) {
      let chunk = step.value
      if (chunk instanceof Promise) {
        chunk.then(chunk => {
          handle(chunk)
          consume(chunks)
        })
        .catch(err => {
          console.log('something wrong?', err ? 'yes ' + err.stack : 'nah')
          consume(chunks)
        })
      } else {
        handle(chunk)
        consume(chunks)
      }
    } else {
      t.equals(consumedShows, totalShows, `consumed ${consumedShows} out of ${totalShows} shows`)
      server.close()
      t.end()
    }
  }

  function handle (chunk) {
    consumedShows++
  }
})
