'use strict'

module.exports = iterable => new Promise(resolve => {
  consume(iterable, resolve)
})
/*
  consume lets you pass an iterable and will iterate over it patiently (waiting for promises to fulfill before calling next), onDone is called when the iterable is done.
*/
function consume (iterable, onDone) {
  let step = iterable.next()
  if (!step.done) {
    let chunk = step.value
    if (chunk instanceof Promise) {
      chunk.then(
        () => consume(iterable, onDone),
        () => consume(iterable, onDone)
      )
    } else {
      consume(iterable, onDone)
    }
  } else if (onDone) {
    onDone()
  }
}
