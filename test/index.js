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
  console.log('Tests finished')
  sharedInstance.stop();
  process.exit(0);
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
