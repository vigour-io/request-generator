# request-generator
Create request generators

```javascript
const requestGenerator = require('request-generator')
// request, chunk, transform, done
const gen = requestGenerator({
 request: 'google.com', 
 chunk: 'item.*', 
 transform: (data) => {}, 
 done: (err, req) => {}
})
 // gen is an async iterator

```

# example

```javascript
const url = 'http://api.themoviedb.org'
const apikey = '&api_key=**********************'
const request = require('request-generator')
const s = require('./')

var page = 1

const a = s(request({
  request: `${url}/3/discover/movie?sort_by=popularity.desc&page=${page}${apikey}`,
  chunk: 'results.*',
  transform: data => ({ [data.id]: data }),
  done: (err, cnt, req) => new Promise(resolve => {
    if (err) { console.log('err time', err) }
    req.path = `/3/discover/movie?sort_by=popularity.desc&page=${++page}${apikey}`
    setTimeout(() => resolve(), 1000)
  })
}))

// keeps loading pages until the whole data base is loaded
a.on(val => console.log(val))
```

### ToDo

- error handling
- throttling of requests / sec for weak APIs
