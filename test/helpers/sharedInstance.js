const fs = require('fs');
const start = require('../../start');

let sharedStop;
module.exports = {
  stop: function () {
    sharedStop && sharedStop();
  },

  start: function (callback) {
    if (sharedStop) {
      return callback(null, sharedStop);
    }

    try {
      fs.rmdirSync('/tmp/rqlite-fp-test-shared', { recursive: true });
    } catch (error) {
      console.log(error);
    }

    start({
      httpAddr: 'localhost:4001',
      raftAddr: 'localhost:4002',
      storage: '/tmp/rqlite-fp-test-shared',
      silent: false
    }, function (error, stop) {
      sharedStop = stop;
      if (error) {
        return callback(error);
      }

      callback(null, stop);
    });
  }
};
