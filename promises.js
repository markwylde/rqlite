const { promisify } = require('util');
const index = require('./index');

module.exports = Object
  .keys(index)
  .reduce((accumulator, method) => {
    accumulator[method] = promisify(index[method]);
    return accumulator;
  }, {});
