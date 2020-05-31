const os = require('os');
const fs = require('fs');
const path = require('path');
const righto = require('righto');
const { spawn } = require('child_process');
const chalk = require('chalk');

const tar = require('tar');
const { http, https } = require('follow-redirects');
const callarest = require('callarest/json');
const { extractTarballDownload } = require('calladownload-extract');

const url = 'https://api.github.com/repos/rqlite/rqlite/releases/latest';

var children = [];
process.on('exit', function () {
  console.log('killing', children.length, 'rqlite processes');
  children.forEach(function (child) {
    child.kill();
  });
});

function fileExists (file, callback) {
  fs.stat(file, function (error, stat) {
    if (error === null) {
      callback(null, true);
    } else if (error.code === 'ENOENT') {
      callback(null, false);
    } else {
      callback(error);
    }
  });
}

function download (options, callback) {
  console.log('downloading rqlite...');
  const releases = righto(callarest, {
    url,
    headers: {
      'User-Agent': 'nodejs'
    }
  });

  const release = releases.get(rest => {
    return rest.body.assets.find(asset => asset.name.includes(os.platform()));
  });

  const downloadUrl = release.get('browser_download_url');
  const downloadDestination = options.tarballPath;
  const extractPath = options.extractPath;

  const createdTargetDirectory = righto(fs.mkdir, options.extractPath);
  const alwaysCreatedTargetDirectory = righto.handle(createdTargetDirectory, function (_, callback) {
    callback();
  });

  const extractionResult = righto(extractTarballDownload,
    downloadUrl,
    downloadDestination,
    extractPath, {
      headers: {
        'User-Agent': 'nodejs'
      },
      httpAgent: http,
      httpsAgent: https
    },
    righto.after(alwaysCreatedTargetDirectory)
  );

  extractionResult(callback);
}

function getFilesInTarball (file, callback) {
  const downloadDestination = file;
  const entries = [];
  tar.t({
    file: downloadDestination,
    onentry: i => entries.push(i.path.split('/').slice(1).join('/'))
  }, function (error) {
    if (error) {
      return callback(error);
    }
    callback(null, entries);
  });
}

function getBinPath (options, callback) {
  if (options.rqliteBinPath) {
    return callback(null, options.rqliteBinPath);
  }
  getFilesInTarball(options.tarballPath, function (error, filePaths) {
    if (error) {
      return callback(error);
    }
    const rqliteBin = filePaths.filter(filePath => filePath.endsWith('rqlited'));
    if (!rqliteBin[0]) {
      return callback(new Error('rqlited was not found in tarball'));
    }
    callback(null, path.join(options.extractPath, rqliteBin[0]));
  });
}

function execute (options, callback) {
  getBinPath(options, function (error, binPath) {
    if (error) {
      return callback(error);
    }

    let isReady = false;
    function finish () {
      if (isReady) {
        return;
      }
      isReady = true;
      callback(null,
        function () {
          ls.kill();
        }
      );
    }
    const cmd = `
      ${binPath} -http-addr ${options.httpAddr} -raft-addr ${options.raftAddr} ${options.join ? `-join ${options.join}` : ''} ${options.storage}
    `.trim();
    console.log(chalk.cyan('Executing ' + cmd));
    const ls = spawn('sh', ['-c', cmd]);

    children.push(ls);

    ls.stdout.on('data', (data) => {
      if (!options.silent) {
        process.stdout.write(chalk.green(data));
      }
    });

    ls.stderr.on('data', (data) => {
      if (!options.silent) {
        process.stdout.write(chalk.yellow(data));
      }

      if (data.includes('bind: address already in use')) {
        console.log(chalk.red('bind: address already in use'));
      }

      if (data.includes('service listening on')) {
        finish();
      }
    });

    ls.on('close', (code) => {
      console.log(`rqlite process exited with code ${code}`);
      finish();
    });
  });
}

function start (options, callback) {
  options = options || {};
  options.tarballPath = options.tarballPath || '/tmp/rqlite.tar.gz';
  options.extractPath = options.extractPath || '/tmp/rqlite';

  options.httpAddr = options.httpAddr || 'localhost:4001';
  options.raftAddr = options.raftAddr || 'localhost:4002';
  options.storage = options.storage || '~/node';
  options.silent = options.silent !== false;

  if (options.rqliteBinPath) {
    return execute(options, callback);
  }

  fileExists(options.tarballPath, function (error, exists) {
    if (error) {
      return callback(error);
    }
    if (!exists) {
      download(options, function (error, result) {
        if (error) {
          return callback(error);
        }
        execute(options, callback);
      });
    } else {
      execute(options, callback);
    }
  });
}

module.exports = start;
