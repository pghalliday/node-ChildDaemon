var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function ChildDaemon(command, args, match) {
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
      var onData;
      var checkMatch = function() {
        var matched = match.exec(stdoutData);
        if (matched && !started) {
          started = true;
          self.emit('start', null, matched);
        }
        return started;
      };

      if (process.platform === 'win32') {
        var spawn = require('child_process').spawn;
        child = spawn(command, args);
        child.stdout.setEncoding();
        child.stderr.setEncoding();
        onData = function(data) {
          stdoutData += data.toString();
          if (checkMatch()) {
            child.stdout.removeListener('data', onData);
            child.stderr.removeListener('data', onData);
          }
        };
        child.stdout.on('data', onData);
        child.stderr.on('data', onData);
      } else {
        // use pty to make sure the output of the spawned process is not buffered
        var pty = require('pty.js');
        child = pty.spawn(command, args);
        child.setEncoding();
        onData = function(data) {
          stdoutData += data.toString();
          if (checkMatch()) {
            child.removeListener('data', onData);
          }
        };
        child.on('data', onData);
      }

      child.on('exit', function() {
        child = null;
        if (!started) {
          self.emit('start', new Error('child failed to start:\n' + stdoutData));
        } else {
          started = false;
          self.emit('stop');
        }
      });
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
util.inherits(ChildDaemon, EventEmitter);

module.exports = ChildDaemon;