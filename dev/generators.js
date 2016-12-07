'use strict'
const urlTool = require('url')
const http = require('http')
const JSONStream = require('JSONStream')

console.log('test dem generators')

// request-generator
function * endPointGenerator ({url, pagination}) {
  let pagesGenerator = pagination.totalPages
    ? parallelPagesGenerator
    : serialPagesGenerator

  let pages = pagesGenerator(url, pagination)
  for (let chunk of pages) {
    yield chunk
  }
}

// should do all in parallel
function * parallelPagesGenerator (url, pagination) {

}

// do pages in serial chain
function * serialPagesGenerator (url, pagination) {
  let page = 0
  let cycleDone
  while (!cycleDone) {
    let gotChunks = 0
    let chunks = chunkGenerator(url, pagination, page)
    for (let chunk of chunks) {
      gotChunks++
      yield chunk
    }
    cycleDone = pagination.after(gotChunks)
    console.log('cycle done?!?!', cycleDone)
    page++
  }
}

// get all chunks from a page
function * chunkGenerator (url, pagination, page) {
  url += pagination.before(page)
  const options = urlTool.parse(url)
  let chunks = []
  let promise
  let ended
  http.request(options, res => {
    res.pipe(JSONStream.parse('results.*'))
    .on('data', chunk => {
      console.log('> stream data')
      if (promise) {
        promise.resolve(chunk)
        promise = false
      } else {
        chunks.push(chunk)
      }
    })
    .on('end', () => {
      console.log('> stream end')
      ended = true
    })
    .on('error', err => {
      console.log('STREAM ERROR!')
      throw err
    })
  })
  .on('error', err => {
    console.log('REQUEST ERROR!')
    throw err
  })
  .end()
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
    } else {
      console.log('---------- no promise!')
      handle(chunk)
      consume(chunks)
    }
  }
}

function handle (chunk) {
  console.log('yay chunk!', chunk)
}

const url = 'http://localhost:4444/shows'
const endpoint = endPointGenerator({
  url,
  pagination: {
    before: page => `?page=${page}&size=10`,
    after: cnt => cnt !== 10
  }
})

consume(endpoint)
