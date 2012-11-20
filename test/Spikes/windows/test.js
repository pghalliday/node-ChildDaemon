var http = require('http');
var spawn = require('child_process').spawn;
var child = spawn(
  'CMD', [
    '/S',
    '/C',
    'node',
    './child.js'
  ]
);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', function() {
  http.get('http://localhost:8080', function(response) {
    console.log('child did NOT die');
  }).on('error', function(error) {
    console.log('child did die');
  });
});

setTimeout(function() {
  http.get('http://localhost:8080', function(response) {
    response.on('end', function() {
      console.log('kill the child');
      child.kill();
    });
  });
}, 2000);