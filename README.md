# request-generator (WIP)
Create request generators

```javascript
const requestGenerator = require('request-generator')
// request, chunk, transform, done
const gen = requestGenerator('google.com', 'item.*', (data) => {}, (err, next, req) => {})
 // gen is an async iterator

```

### ToDo

- define `POST` request payloads per page
- error handling
- throttling of requests / sec for weak APIs
