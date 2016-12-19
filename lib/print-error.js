'use strict'

module.exports = function printError (err) {
  console.log('\n\n==== Unhandled rejection ====')
  if (err) {
    if (err.response) {
      console.log('RESPONSE CODE', err.response.statusCode)
    }
    if (err.data) {
      console.log(err.data)
    }
    if (err.request) {
      console.log('request info:\n', err.request)
    }
    if (!err.request) {
      console.log('bad code!')
    }
  } else {
    console.log('unhandled rejection of', err)
  }
  console.log('=============================\n\n')
}
