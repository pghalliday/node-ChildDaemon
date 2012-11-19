var expect = require('expect.js'),
    ChildKiller = require('../../'),
    fork = require('child_process').fork,
    http = require('http');

var PORT = 8080;

describe('ChildKiller', function() {
  it('should start and stop child processes', function(done) {
    var childKiller = new ChildKiller(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)', 'g')
    );
    childKiller.start(function(error, matched) {
      if (error) {
        expect().fail('Error encountered starting child:\n' + error);
      } else {
        expect(matched[1]).to.eql(PORT);
        http.get('http://localhost:' + PORT, function(response) {
          expect(response.statusCode).to.equal(200);
          response.on('end', function() {
            childKiller.stop(function(error) {
              if (error) {
                expect().fail('Error encountered stopping child:\n' + error);
              } else {
                http.get('http://localhost:' + PORT, function(response) {
                  expect().fail('should not get a response after child has been stopped:\n' + response);
                }).on('error', function(error) {
                  // child http server should have been stopped
                  done();
                });
              }
            });
          });
        }).on('error', function(error) {
          expect().fail('Error encountered communicating with child:\n' + error);
        });
      }
    });
  });
  
  it('should error if an invalid child is specified', function(done) {
    var childKiller = new ChildKiller(
      'blahblahblah',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)', 'g')
    );
    childKiller.start(function(error, matched) {
      expect(error.message).to.contain('child failed to start');
      expect(matched).to.not.be.ok();
      done();
    });
  });

  it('should error if stopped before started', function(done) {
    var childKiller = new ChildKiller(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)', 'g')
    );
    childKiller.stop(function(error) {
      expect(error.message).to.be('child not started');
      done();
    });    
  });

  it('should error if started when already running', function(done) {
    var childKiller = new ChildKiller(
      'node',
      ['./test/Support/childProcess.js', PORT],
      new RegExp('Listening on port ([0-9]+)', 'g')
    );
    childKiller.start(function(error, matched) {
      if (error) {
        expect().fail('Error encountered starting child:\n' + error);
      } else {
        expect(matched[1]).to.eql(PORT);
        childKiller.start(function(error, matched) {
          expect(error.message).to.be('child already started');
          expect(matched).to.not.be.ok();
          childKiller.stop(function(error) {
            if (error) {
              expect().fail('Error encountered stopping child:\n' + error);
            }
            done();
          });
        });
      }
    });
  });

  it.skip('should work with processes that buffer output when no tty', function(done) {
    done();
  });
});