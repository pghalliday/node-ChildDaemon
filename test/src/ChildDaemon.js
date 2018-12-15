const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const ChildDaemon = require('../../');
const request = require('request-promise-native');

const expect = chai.expect;
const PORT = '8080';

chai.use(chaiAsPromised);

describe('ChildDaemon', () => {
  it('should start and stop child daemon processes', () => {
    const childDaemon = new ChildDaemon(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)')
    );
    return childDaemon
      .start()
      .then (matched => {
        expect(matched[1]).to.eql(PORT);
        return request('http://localhost:' + PORT);
      })
      .then(body => {
        expect(body).to.equal('hello');
        return childDaemon.stop();
      })
      .then(() => {
        return expect(request('http://localhost:' + PORT)).to.be.rejected;
      });
  });
  
  it('should error if an invalid child is specified', () => {
    const childDaemon = new ChildDaemon(
      'blahblahblah',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)')
    );
    return expect(childDaemon.start()).to.be.rejectedWith('child failed to start');
  });

  it('should error if stopped before started', () => {
    const childDaemon = new ChildDaemon(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)')
    );
    return expect(childDaemon.stop()).to.be.rejectedWith('child not started');
  });

  it('should error if started when already running', () => {
    const childDaemon = new ChildDaemon(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)')
    );
    return childDaemon
      .start()
      .then(matched => {
        expect(matched[1]).to.eql(PORT);
        return expect(childDaemon.start()).to.be.rejectedWith('child already started');
      })
      .then(() => childDaemon.stop());
  });

  it.skip('should work with processes that buffer output when no tty', () => {
    // TODO: i know some programs that do this (eg. ruby) but not sure
    // how to integrate the test. For now i am leaving this with the knowledge
    // that the use of pty.js fixes the problem (it is only a problem on *.nix
    // systems afaik) and I have tested it outside of these tests - at the moment i do
    // not want to make the tests dependent on other programs though
  });
});
