const sqlString = require('sqlstring');
const callarest = require('callarest/json');
const { http, https } = require('follow-redirects');

function run (connection, sql, parameters, callback) {
  if (arguments.length === 3) {
    callback = parameters;
    parameters = null;
  }

  if (!parameters) {
    parameters = [];
  }

  sql = sqlString.format(sql, parameters);

  callarest({
    method: 'post',
    body: [sql],
    url: `${connection.url}/db/execute?pretty&timings`,
    httpAgent: http,
    httpsAgent: https
  }, function (error, rest) {
    if (error) {
      return callback(error);
    }

    if (rest.body.results[0].error) {
      return callback(new Error(`RQLITE_ERROR: ${rest.body.results[0].error}`));
    }

    return callback(null, rest.body);
  });
}

module.exports = run;
