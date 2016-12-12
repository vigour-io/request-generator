'use strict'

const test = require('tape')
const requestGenerator = require('../')
const server = require('./server')
server.listen(4444)

test('pagination - 100 shows in 10 pages', t => {
  const pageSize = 10
  var page = 0
  const request = 'http://localhost:4444/shows?page=0&size=10'
  var errors = []
  const endpoint = requestGenerator({
    request,
    stream: 'results.*',
    done: (err, request, chunkCount) => {
      if (err) {
        errors = errors.concat(err)
        console.log('error during this request:', err)
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
  consume({chunks: endpoint,
    onChunk: chunk => consumedShows++,
    done: () => {
      t.equals(consumedShows, totalShows, `consumed ${consumedShows} out of ${totalShows} shows`)
      t.end()
    }
  })
})

test('errors - getting error types', t => {
  const request = 'http://shmocalshmost/error-prone?page=0&size=10'
  const errors = []
  const endpoint = requestGenerator({
    request,
    stream: 'results.*',
    transform (chunk) {
      console.log('wext chunk', chunk)
    },
    done: (err, request, chunkCount) => {
      if (err) {
        errors.push(err)
        const step = errors.length
        switch (step) {
          case 1: //
            t.equals(err.type, 'request', 'first error is request error')
            t.ok(err.request, 'error contains request options')
            request.hostname = 'localhost'
            request.path = '/notjson'
            request.port = 4444
            break
          case 2:
            t.equals(err.type, 'stream', 'second error is stream error')
            t.ok(err.request, 'error contains request options')
            request.path = '/404'
            break
          case 3:
            t.equals(err.type, 'response', 'third error is error response')
            t.ok(err.request, 'error contains request options')
            t.ok(err.response, 'error contains response object')
            t.ok(err.data, 'error contains response data')
            return { done: true }
        }
        if (step === 1) {
          t.pass
        }
      } else {
        t.fail('no errors reported in done callback')
        return { done: true }
      }
    }
  })
  var rejects = 0
  consume({
    chunks: endpoint,
    done () {
      t.equals(rejects, 3, 'errors lead to rejecting chunks')
      t.end()
    },
    onError () {
      rejects++
    }
  })
})

test('spawning - requests lead to new requests', t => {
  var cycle = 0
  const totalCycles = 3
  var rows = 0
  var items = 0
  var totalRows = totalCycles * 4
  var totalItems = totalCycles * 12
  const getRows = requestGenerator({
    request: 'http://localhost:4444/discover',
    stream: 'results.*',
    transform (row) {
      rows++
      const getItems = requestGenerator({
        request: `http://localhost:4444/discover/row/${row.id}`,
        stream: 'results.*',
        transform (item) {
          items++
        }
      })
      return new Promise((resolve, reject) => {
        consume({
          chunks: getItems,
          done (err) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          }
        })
      })
    },
    done (err, request, chunkCount) {
      if (err) {
        t.fail(err)
      }
      if (++cycle === totalCycles) {
        t.equals(rows, totalRows, `consumed ${rows} of ${totalRows} rows`)
        t.equals(items, totalItems, `consumed ${items} of ${totalItems} items`)
        t.end()
        return { done: true }
      }
    }
  })
  consume({ chunks: getRows })
})

test('teardown', t => {
  server.close()
  t.pass('closed server')
  t.end()
})

function consume ({ chunks, onChunk, onError, done }) {
  let step = chunks.next()
  if (!step.done) {
    let chunk = step.value
    if (chunk instanceof Promise) {
      chunk.then(chunk => {
        onChunk && onChunk(chunk)
        consume({ chunks, onChunk, onError, done })
      })
      .catch(err => {
        if (err && onError) {
          onError(err)
        }
        consume({ chunks, onChunk, onError, done })
      })
    } else {
      onChunk && onChunk(chunk)
      consume({ chunks, onChunk, onError, done })
    }
  } else {
    done && done()
  }
}
