const callarest = require('callarest/json');
const { http, https } = require('follow-redirects');

function connect (url, callback) {
  callarest({
    url: `${url}/db/query?q=SELECT%20date(%27now%27)&pretty&timings`,
    httpAgent: http,
    httpsAgent: https
  }, function (error, rest) {
    if (error) {
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
