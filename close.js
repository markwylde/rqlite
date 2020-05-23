const chalk = require('chalk');

function close (connection, callback) {
  console.warn(chalk.yellow('WARNING: rqlite connections are not stateful or persistent so do not need to be closed'));
  callback();
}

module.exports = close;
