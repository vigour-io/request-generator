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
    done (err, chunkCount, request) {
      if (err) {
        console.log('errors during this request:', err)
      }
      if (chunkCount !== pageSize) {
        return { done: true } // @NOTE: could also reset page count here
      } else {
        console.log('lolwhat', request)
        request.path = `/shows?page=${++page}&size=10`
      }
    }
  })
  const totalShows = 100
  let consumedShows = 0
  consume(endpoint)

  function consume (chunks) {
    console.log('----------------------- consume!')
    let step = chunks.next()
    if (!step.done) {
      let chunk = step.value
      console.log('got next!', chunk)
      if (chunk instanceof Promise) {
        console.log('---------- promise!')
        chunk.then(chunk => {
          console.log('---------- promise resolved!')
          handle(chunk)
          consume(chunks)
        })
        .catch(err => {
          console.log('something wrong?', err ? 'yes ' + err.stack : 'nah')
          consume(chunks)
        })
      } else {
        console.log('---------- no promise!')
        handle(chunk)
        consume(chunks)
      }
    } else {
      console.log('weyo reached the end!')
      t.equals(consumedShows, totalShows, `consumed all ${totalShows} shows`)
      server.close()
      t.end()
    }
  }

  function handle (chunk) {
    console.log('yay chunk!', chunk)
    consumedShows++
  }
})
