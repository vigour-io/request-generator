# request-generator
Create request generators

```javascript
const requestGenerator = require('request-generator')
requestGenerator({
  request: 'https://google'
  // request: { host: },
  chunk: 'items.*', // optional can also be a function
  transform: data => {}, // optional
  done: err => {}, // optional
  pagination: { //default is before, optional
    before: (requestOptions, i, cancel, options) => {

    }
    after: (hits, i, cancel, options) => {

    }
  }
})

for (let hello of requestGenerator()) {
  console.log(hello)
}
```