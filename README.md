# request-generator
Create generator functions that yield chunks of data from API endpoints.

```js
const requestGenerator = require('request-generator')

const gen = requestGenerator({
 request: 'google.com', 
 stream: 'item.*', 
 transform: (data) => {}, 
 done: (err, req) => {}
})

```

### Install

```
npm i --save request-generator

yarn add request-generator
```

### How to use

### ToDo

- throttling of requests / sec for weak APIs
