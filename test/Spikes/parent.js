var spawn = require('child_process').spawn;
var child = spawn('node', ['./child.js'], {
  stdio: 'inherit'
});
