const callarest = require('callarest/json');
const { http, https } = require('follow-redirects');

function connect (url, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  callarest({
    url: `${url}/db/query?q=SELECT%20date(%27now%27)&pretty&timings`,
    httpAgent: http,
    httpsAgent: https
  }, function (error, rest) {
    if (error && options.retries > 0) {
      setTimeout(() => {
        connect(url, {
          ...options,
          retries: options.retries - 1
        }, callback);
      }, options.retryDelay || 1000);
      return;
    }

    if (error) {
      if (error.code === 'ECONNREFUSED') {
        return callback(new Error('ECONNREFUSED: Could not connect to ' + url));
      }
      return callback(error);
    }

    if (rest.body && rest.body.results && rest.body.time) {
      return callback(null, { url });
    }

    console.log('Body returned was: ', rest.body);
    return callback(new Error('url does not look like an rqlite database'));
  });
}

module.exports = connect;
