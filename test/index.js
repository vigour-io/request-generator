'use strict'

const test = require('tape')

test('basics - make a request generator', t => {
  const pageSize = 10
  const requestGenerator = require('../')
  console.log('wex?', requestGenerator)
  const gen = requestGenerator({
    request: 'http://localhost:4444/shows',
    pagination: {
      before: (requestOptions, i, cancel, options) => {
        console.log('pagination before is called!')
        requestOptions.path += `?pageSize=${pageSize}`
      },
      after: (hits, i, cancel, options) => {
        console.log('pagination after is called!')
        console.log('HITS', hits)
        if (hits < pageSize) {
          cancel()
        }
      }
    },
    pattern: 'results.*',
    transform (data) {
      console.log('got data chunk yes!')
    }
  })

  for (let result of gen()) {
    console.log('=========> transaction done!', result)
  }
})
