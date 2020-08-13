const http = require('http');
const righto = require('righto');
const tape = require('tape');
const test = require('righto-tape');

const connect = require('../connect');
const run = require('../run');
const execute = require('../execute');
const getAll = require('../getAll');
const getOne = require('../getOne');
const close = require('../close');

const sharedInstance = require('./helpers/sharedInstance');

tape.onFinish(() => {
  console.log('Tests finished');
  sharedInstance.stop();
  process.exit(0);
});

test('connect with no callback', function * (t) {
  t.plan(1);

  try {
    connect('http://localhost:4001');
  } catch (error) {
    t.equal(error.message, 'rqlite.connect requires a callback');
  }
});

test('connect to something not rqlite - json', function * (t) {
  t.plan(1);

  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end('{"a":1}');
  }).listen(4002);

  connect('http://localhost:4002', (error, result) => {
    t.equal(error.message, 'url does not look like an rqlite database');
    server.close();
  });
});

test('connect to something not rqlite - not json', function * (t) {
  t.plan(1);

  const server = http.createServer((request, response) => {
    response.end('im not rqlite');
  }).listen(4002);

  connect('http://localhost:4002', (error, result) => {
    t.equal(error.message, 'The response body could not be JSON.parsed');
    server.close();
  });
});

test('connect when not running', function * (t) {
  t.plan(1);

  connect('http://localhost:4001', function (error) {
    t.equal(error.message, 'ECONNREFUSED: Could not connect to http://localhost:4001');
  });
});

test('connect with retries when not running', function * (t) {
  t.plan(3);

  const startTime = Date.now();
  connect('http://localhost:4001', { retries: 3, retryDelay: 100 }, function (error) {
    const endTime = Date.now();
    t.ok(endTime - startTime > 300, 'Took more than 300ms to fail');
    t.ok(endTime - startTime > 300, 'Took less than 1000ms to fail');
    t.equal(error.message, 'ECONNREFUSED: Could not connect to http://localhost:4001');
  });
});

test('connect with retries when not running - with no retires set', function * (t) {
  t.plan(3);

  const startTime = Date.now();
  connect('http://localhost:4001', { retries: 3 }, function (error) {
    const endTime = Date.now();
    t.ok(endTime - startTime > 300, 'Took more than 300ms to fail');
    t.ok(endTime - startTime > 300, 'Took less than 1000ms to fail');
    t.equal(error.message, 'ECONNREFUSED: Could not connect to http://localhost:4001');
  });
});

test('connect with retries when not running', function * (t) {
  t.plan(3);

  const startTime = Date.now();
  connect('http://localhost:4001', { retries: 3, retryDelay: 100 }, function (error) {
    const endTime = Date.now();
    t.ok(endTime - startTime > 300, 'Took more than 300ms to fail');
    t.ok(endTime - startTime > 300, 'Took less than 1000ms to fail');
    t.equal(error.message, 'ECONNREFUSED: Could not connect to http://localhost:4001');
  });
});

test('connect with retries with onRetry', function * (t) {
  t.plan(1);

  connect('http://localhost:4001', { retries: 1, retryDelay: 100, onRetry: () => t.pass() }, () => {});
});

// test('launch', function * (t) {
//   t.plan(1);

//   const stop = yield righto(start, {
//     httpAddr: 'localhost:4001',
//     raftAddr: 'localhost:4002',
//     storage: '/tmp/rqlite-fp-test-launch',
//     silent: false
//   })

//   stop();
//   t.pass();
// });

test('connect', function * (t) {
  t.plan(1);

  yield righto(sharedInstance.start);

  yield righto(connect, 'http://localhost:4001');

  t.pass();
});

test('run: incorrect sql', function * (t) {
  t.plan(1);

  const connection = righto(connect, 'http://localhost:4001');
  const tableCreated = righto(run, connection, '_WRONG SQL');

  tableCreated(function (error, success) {
    t.equal(error.toString(), 'Error: RQLITE_ERROR: near "_WRONG": syntax error');
  });
});

test('run', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(run, connection, 'CREATE TABLE lorem (info TEXT)');

  t.pass();

  yield righto(run, connection, 'DROP TABLE lorem');
});

test('execute: incorrect sql', function * (t) {
  t.plan(1);

  const connection = righto(connect, 'http://localhost:4001');
  const tableCreated = righto(execute, connection, '_WRONG SQL');

  tableCreated(function (error, success) {
    t.equal(error.toString(), 'Error: RQLITE_ERROR: near "_WRONG": syntax error');
  });
});

test('execute', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');

  t.pass();

  yield righto(run, connection, 'DROP TABLE lorem');
});

test('getAll: incorrect sql', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  const getRecords = righto(getAll, connection, '_WRONG SQL');

  getRecords(function (error) {
    t.equal(error.toString(), 'Error: RQLITE_ERROR: near "_WRONG": syntax error');
  });
});

test('getAll: no records', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');
  const rows = yield righto(getAll, connection, 'SELECT * FROM lorem');

  t.deepEqual(rows, []);

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('getAll: one record', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test')
  `);

  const rows = yield righto(getAll, connection, 'SELECT * FROM lorem');

  t.deepEqual(rows, [{ info: 'test' }]);

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('getAll: sql injection', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test')
  `);

  const rows = yield righto(getAll, connection, 'SELECT * FROM lorem WHERE info = ?', ['test']);

  t.deepEqual(rows, [{ info: 'test' }]);

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('getAll: multiple records', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test1')
  `);

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test2')
  `);

  const rows = yield righto(getAll, connection,
    'SELECT * FROM lorem'
  );

  t.deepEqual(rows, [
    { info: 'test1' },
    { info: 'test2' }
  ]);

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('getOne: incorrect sql', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  const tableCreated = righto(getOne, connection, '_WRONG SQL');

  tableCreated(function (error) {
    t.equal(error.toString(), 'Error: RQLITE_ERROR: near "_WRONG": syntax error');
  });
});

test('getOne: no records', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');
  const row = yield righto(getOne, connection, 'SELECT * FROM lorem');

  t.notOk(row);

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('getOne: multiple records', function * (t) {
  t.plan(1);

  const connection = yield righto(connect, 'http://localhost:4001');
  yield righto(execute, connection, 'CREATE TABLE lorem (info TEXT)');

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test1')
  `);

  yield righto(execute, connection, `
    INSERT INTO lorem (info) VALUES ('test2')
  `);

  const row = yield righto(getOne, connection,
    'SELECT * FROM lorem'
  );

  t.deepEqual(row, { info: 'test1' });

  yield righto(execute, connection, 'DROP TABLE lorem');
});

test('close: database', function * (t) {
  t.plan(2);

  const connection = righto(connect, 'http://localhost:4001');

  const closedConnection = righto(close, connection, righto.after(connection));

  closedConnection(function (error, result) {
    t.notOk(error);
    t.notOk(result);
  });
});
