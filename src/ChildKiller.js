var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn;

function ChildKiller(command, args, match) {
  var self = this,
      started = false,
      child;

  function killChild() {
    child.kill();
  }

  self.start = function(callback) {
    self.once('start', callback);
    if (started) {
      self.emit('start', new Error('child already started'));
    } else {
      var stdoutData = '';
      var stdout;
      
      child = spawn(command, args);
      child.on('exit', function(code, signal) {
        child = null;
        if (!started) {
          self.emit('start', new Error('child failed to start:\n' + stdoutData));
        } else {
          started = false;
          self.emit('stop');
        }
      });

      // monitor both stdout and stderr for the match expression
      child.stdout.setEncoding();
      child.stderr.setEncoding();
      var onData = function(data) {
        stdoutData += data.toString();
        var matched = match.exec(stdoutData);
        if (matched && !started) {
          started = true;
          child.stdout.removeListener('data', onData);
          child.stderr.removeListener('data', onData);
          self.emit('start', null, matched);
        }
      };
      child.stdout.on('data', onData);
      child.stderr.on('data', onData);
    }
  };
  
  self.stop = function(callback) {
    self.once('stop', callback);
    if (!started) {
      self.emit('stop', new Error('child not started'));
    } else {
      killChild();
    }
  };
}
util.inherits(ChildKiller, EventEmitter);

module.exports = ChildKiller;