const righto = require('righto');

function batch (connection, sql, listOfParameters, callback) {
  if (arguments.length === 3) {
    callback = listOfParameters;
    listOfParameters = null;
  }

  if (!listOfParameters) {
    listOfParameters = [];
  }

  throw new Error('batch not implemented yet')
}

module.exports = batch;
