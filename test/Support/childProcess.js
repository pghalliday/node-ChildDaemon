const http = require('http');
const port = process.argv[2];
const server = http.createServer((request, response) => {
  response.end('hello');
});
server.listen(port, function() {
  console.log('Listening on port ' + port);
});
