const callarest = require('callarest/json');

function getAll (connection, sql, parameters, callback) {
  if (arguments.length === 3) {
    callback = parameters;
    parameters = null;
  }

  if (!parameters) {
    parameters = [];
  }

  callarest({
    url: `${connection.url}/db/query?q=${sql}&pretty&timings`
  }, function (error, rest) {
    if (error) {
      return callback(error);
    }

    if (rest.body.results[0].error) {
      return callback(new Error(`RQLITE_ERROR: ${rest.body.results[0].error}`));
    }

    const keys = rest.body.results[0].columns;
    const rows = (rest.body.results[0].values || []).map(row => {
      return row.reduce((obj, value, index) => {
        obj[keys[index]] = value;
        return obj;
      }, {});
    });

    return callback(null, rows[0]);
  });
}

module.exports = getAll;
