# rqlite-fp
[![Build Status](https://travis-ci.org/markwylde/rqlite-fp.svg?branch=master)](https://travis-ci.org/markwylde/rqlite-fp)
[![David DM](https://david-dm.org/markwylde/rqlite-fp.svg)](https://david-dm.org/markwylde/rqlite-fp)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/markwylde/rqlite-fp)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/markwylde/rqlite-fp)](https://github.com/markwylde/rqlite-fp/releases)
[![GitHub](https://img.shields.io/github/license/markwylde/rqlite-fp)](https://github.com/markwylde/rqlite-fp/blob/master/LICENSE)

A client library for rqlite in a functional programming style

## Installation
```bash
npm install --save rqlite-fp
```

## Example
### With promises
```javascript
const rqlite = require('rqlite-fp/promises');

(async function () {
  const connection = await connect('http://localhost:4001')
  const tableCreated = await execute(connection, 'CREATE TABLE lorem (info TEXT)')
  const testResults = await getAll(connection, 'SELECT * FROM test')

  console.log(results)
}())
```

### With callbacks
```javascript
const connect = require('rqlite-fp/connect')
const execute = require('rqlite-fp/execute')
const getAll = require('rqlite-fp/getAll')

function getTestRecords (callback) {
  connect('http://localhost:4001', function (error, connection) {
    if (error) { return callback(error) }
    execute(connection, 'CREATE TABLE lorem (info TEXT)', function (error, tableCreated) {
      if (error) { return callback(error) }
      getAll(connection, 'SELECT * FROM test', function (error, testResults) {
        if (error) { return callback(error) }
        callback(null, testResults)
      })
    })
  })
}

getTestRecords(function (error, testRecords) {
  if (error) {
    throw error
  }
  console.log(testRecords)
})
```

### With [righto](https://github.com/KoryNunn/righto)
```javascript
const righto = require('righto')
const connect = require('rqlite-fp/connect')
const execute = require('rqlite-fp/execute')
const getAll = require('rqlite-fp/getAll')

const connection = righto(connect, 'http://localhost:4001')
const tableCreated = righto(execute, connection, 'CREATE TABLE lorem (info TEXT)')
const testResults = righto(getAll, connection, 'SELECT * FROM test', righto.after(tableCreated))

testResults(function (error, results) {
  if (error) {
    throw error
  }

  console.log(results)
})
```

## Functions signatures
### start -> {httpAddr, raftAddr, join} -> (error, connection)
### connect -> filename -> [mode] -> (error, connection)
### run -> connection -> sql -> [parameters] -> (error, result={lastId, changes})
### getAll -> connection -> sql -> (error, rows)
### getOne -> connection -> sql -> (error, row)
### batch -> connection -> sql -> [[parameters]] -> (error, result={lastId, changes})
### execute -> connection -> sql -> (error, connection)
### close -> connection -> (error)

## License
This project is licensed under the terms of the MIT license.
