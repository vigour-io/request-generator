const http = require('http')
const querystring = require('querystring')

module.exports = http.createServer((req, res) => {
  // console.log('=== server ===', 'got request', req.url)
  if (req.url.indexOf('/shows') !== -1) {
    // console.log('SHOWS')
    let params = req.url.split('?')[1]
    params = params && querystring.parse(params)
    let response = {
      status: 'good',
      results: []
    }
    let i = params.page * params.size
    let n = 0
    // console.log('start at', i)
    let show
    while ((show = shows[i++]) && n < params.size) {
      n++
      // console.log('put in show', show)
      response.results.push(show)
    }
    // console.log('respend!')
    res.end(JSON.stringify(response))
  } else if (req.url === '/discover') {
    res.end(JSON.stringify({
      results: discover
    }))
  } else if (req.url.indexOf('/discover/row/') !== -1) {
    const row = req.url.split('/discover/row/')[1]
    res.end(JSON.stringify({
      results: rows[row]
    }))
  } else if (req.url === '/notjson') {
    res.end('lols')
    // res.end(badJSON) // @TODO: check this out bad json is not bad enough?
  } else if (req.url === '/404') {
    res.writeHead(404)
    res.end('<html><head><title>Page no find</head><body>nope</body></html>')
  } else {
    console.log('undefined endpoint')
    res.end('"hi this is the mockserver!"')
  }
})

const shows = []
let i = 0
while (i++ < 100) {
  shows.push({
    title: 'show_' + i
  })
}
// const badBase = { results: shows }
// const badJSON = JSON.stringify(badBase).slice(0, -5)

const discover = []
const rows = []
for (let i = 0; i < 4; i++) {
  discover.push({type: 'row', id: i})
  rows[i] = []
  for (let j = 0; j < 3; j++) {
    rows[i].push({ type: 'item', id: `${i}-${j}` })
  }
}

console.log('???', JSON.stringify({
  results: discover
}))
