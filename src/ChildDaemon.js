const EventEmitter = require('events');

module.exports = class ChildDaemon extends EventEmitter {
  constructor(command, args, match) {
    super();
    this._command = command;
    this._args = args;
    this._match = match;
    this._started = false;
    this._child = undefined;
    this._stdoutData = '';
    this._onExit = this._onExit.bind(this);
    try {
      // if pty.js is not installed then this will throw an error (and it
      // should mean we are on windows)
      this._pty = require('pty.js');
      this._start = this._ptyStart;
    } catch (error) {
      if (process.platform !== 'win32') {
        // on non windows platforms log a warning to watch out for output buffering
        console.warn('pty.js not found and not on windows - ouput buffering may prevent proper detection of a correctly started process');
      }
      this._spawn = require('child_process').spawn;
      this._start = this._spawnStart;
    }
  }

  _checkMatch() {
    const matched = this._match.exec(this._stdoutData);
    if (matched && !this._started) {
      this._started = true;
      this.emit('start', matched);
    }
    return this._started;
  }

  _onExit(error) {
    this._child = null;
    if (!this._started) {
      this.emit('error', new Error('child failed to start:\n' + this._stdoutData));
    } else {
      this._started = false;
      this.emit('stop');
    }
  }

  _ptyStart() {
    this._child = this._pty.spawn(this._command, this._args);
    this._child.setEncoding();
    const onData = data => {
      this._stdoutData += data.toString();
      if (this._checkMatch()) {
        this._child.removeListener('data', onData);
      }
    };
    this._child.on('data', onData);
    this._child.on('exit', this._onExit);
  }

  _spawnStart() {
    this._child = this._spawn(this._command, this._args);
    this._child.stdout.setEncoding();
    this._child.stderr.setEncoding();
    const onData = data => {
      this._stdoutData += data.toString();
      if (this._checkMatch()) {
        this._child.stdout.removeListener('data', onData);
        this._child.stderr.removeListener('data', onData);
        this._child.removeListener('error', this._onExit);
      }
    };
    this._child.stdout.on('data', onData);
    this._child.stderr.on('data', onData);
    this._child.on('error', this._onExit);
    this._child.on('exit', this._onExit);
  }

  start() {
    return new Promise((resolve, reject) => {
      this.once('error', reject);
      this.once('start', resolve);
      if (this._started) {
        this.emit('error', new Error('child already started'));
      } else {
        this._start();
      }
    });
  }

  stop() {
    return new Promise((resolve, reject) => {
      this.once('stop', resolve);
      this.once('error', reject);
      if (!this._started) {
        this.emit('error', new Error('child not started'));
      } else {
        this._child.kill();
      }
    });
  }
}
