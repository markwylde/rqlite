const callarest = require('callarest/json');
const { http, https } = require('follow-redirects');

function connect (url, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  if (typeof callback !== 'function') {
    throw new Error('rqlite.connect requires a callback');
  }

  options.errorStack = options.errorStack || (new Error('ss')).stack.split('\n').slice(1).join('\n');

  callarest({
    url: `${url}/db/query?q=SELECT%20date(%27now%27)&pretty&timings`,
    httpAgent: http,
    httpsAgent: https
  }, function (error, rest) {
    if (error && options.retries > 0) {
      options.onRetry && options.onRetry(options.retries);

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
        error = new Error('ECONNREFUSED: Could not connect to ' + url);
      }
      error.stack = error.stack + '\n' + options.errorStack;
      return callback(error);
    }

    if (rest.body && rest.body.results && rest.body.time) {
      return callback(null, { url });
    }

    console.log('Body returned was: ', rest.body);
    error = new Error('url does not look like an rqlite database');
    error.stack = error.stack + '\n' + options.errorStack;
    return callback(error);
  });
}

module.exports = connect;
