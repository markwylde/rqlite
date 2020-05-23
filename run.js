const callarest = require('callarest/json');

function run (connection, sql, parameters, callback) {
  if (arguments.length === 3) {
    callback = parameters;
    parameters = null;
  }

  if (!parameters) {
    parameters = [];
  }

  callarest({
    method: 'post',
    body: [sql],
    url: `${connection.url}/db/query?q=SELECT%20date(%27now%27)&pretty&timings`
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
