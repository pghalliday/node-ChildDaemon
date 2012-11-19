var http = require('http');
var child;

if (process.platform === 'win32') {
  var spawn = require('child_process').spawn;
  child = spawn(
    'CMD', [
      '/S',
      '/C',
      'node',
      './parent.js'
    ]
  );
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
} else {
  var pty = require('pty.js');
  child = pty.spawn(
    'node', [
      './parent.js'
    ], {
      name: 'parent',
      cols: 80,
      rows: 30
    }
  );
  child.pipe(process.stdout);
}

child.on('exit', function() {
  http.get('http://localhost:8080', function(response) {
    console.log('All children did NOT die');
  }).on('error', function(error) {
    console.log('All children did die');
  });
});

setTimeout(function() {
  http.get('http://localhost:8080', function(response) {
    response.on('end', function() {
      console.log('All children must die');
      child.kill();
    });
  });
}, 2000);
