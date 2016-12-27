'use strict'

module.exports = function consume ({ chunks, onChunk, onError, onDone }) {
  let step = chunks.next()
  if (!step.done) {
    let chunk = step.value
    if (chunk instanceof Promise) {
      chunk.then(chunk => {
        onChunk && onChunk(chunk)
        consume({ chunks, onChunk, onError, onDone })
      })
      .catch(err => {
        if (err && onError) {
          onError(err)
        }
        consume({ chunks, onChunk, onError, onDone })
      })
    } else {
      onChunk && onChunk(chunk)
      consume({ chunks, onChunk, onError, onDone })
    }
  } else {
    onDone && onDone()
  }
}
