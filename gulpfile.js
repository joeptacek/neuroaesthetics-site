const gulp = require('gulp');
const bs = require('browser-sync').create();
const { spawn, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const del = require('del');
const mkdirp = require('mkdirp');
const log = require('fancy-log');
const url = require('url');

const args = process.argv;
const devLocalData = args.includes('--local');
const production = args.includes('--production') || args.includes('deploy');
if (production) {
  if (devLocalData) {
    throw new Error("Cannot use `--local` with `--production` or `deploy`");
  } else {
    process.env['JEKYLL_ENV'] = "production";
  }
} else {
  process.env['JEKYLL_ENV'] = "development";
}

gulp.task('data', function (cb) {
  const outputDir = '_data/external'
  const dataFilenames = ['news.json', 'publications.json']
  const localDataSource = '../chatlab-site/_data/';
  const remoteDataSource = 'https://raw.githubusercontent.com/joeptacek/chatlab-site/master/_data/'
  let httpError = false;


  // rm -rf _data/ && mkdir _data
  // fs.rmdir will error if non-empty, best to use del (or rimraf) module for rm -rf
  // add trailing slash to remove matching dirs while ignoring files
  del([outputDir + '/']).then(delPaths => {
    mkdirp(outputDir, error => {
      if (error) {
        return cb(error); // mkdirp error
      } else {
        if (delPaths.length > 0) {
          log(`Data: Cleaned ${outputDir}`);
        }
        if (!devLocalData) {
          writeAllFromRemote();
        } else {
          writeAllFromLocal();
        }
      }
    });
  }).catch(delError => {
    cb(delError) // del error
  });

  function writeAllFromRemote() {
    const proms = dataFilenames.map(dataFilename => {
      return new Promise((resolve, reject) => {
        writeFromRemote(dataFilename, resolve, reject);
      });
    })

    Promise.all(proms).then(() => cb()).catch(reason => {
      httpError = true;
      return cb(reason);
    });

    function writeFromRemote(dataFilename, resolve, reject) {
      const dataSourceURL = url.resolve(remoteDataSource, dataFilename);
      log(`Data: Requesting ${dataFilename}`);
      https.get(dataSourceURL, res => {
        if (!httpError) {
          log(`Data: Received response from ...${dataFilename}`);
          const { statusCode } = res;
          const contentLength = res.headers['content-length'];
          const maxContentLength = 5000000;

          let resError;
          if (statusCode !== 200) {
            resError = new Error(`Data: Response issue for ...${dataFilname}. Wrong status, ${statusCode}`);
          } else if ( contentLength > maxContentLength ) {
            resError = new Error(`Data: Response issue for ...${dataFilename}. Too large, ${contentLength} B`);
          }

          if (resError) {
            // consume response data to free up memory (necessary? included in node docs for http)
            res.resume();
            return reject(resError); // error related to response from https.get
          }

          log(`Data: Writing ${contentLength} B to ${outputDir}/${dataFilename}`);
          writePipe = res.pipe(fs.createWriteStream(path.join(outputDir, dataFilename)));
          writePipe.on('finish', resolve);
          writePipe.on('error', e => { reject(e) });
        } else {
          log(`Data: Received response for ...${dataFilename}, but aborting due to error`)
        }
      }).on('error', e => {
        reqError =  new Error(`Data: Request issue for ${dataFilename}, got \`${e.message})\``);
        return reject(reqError); // http.get error
      });
    }
  }

  function writeAllFromLocal() {
    const proms = dataFilenames.map(dataFilename => {
      return new Promise((resolve, reject) => {
        writeFromLocal(dataFilename, resolve, reject);
      });
    })

    Promise.all(proms).then(() => cb()).catch(reason => {
      return cb(reason);
    });

    function writeFromLocal(dataFilename, resolve, reject) {
      try {

      }
      // TODO: catch errors with createReadStream e.g., if localDataSource doesn't exist
      writePipe = fs.createReadStream(path.join(localDataSource, dataFilename)).pipe(fs.createWriteStream(path.join(outputDir, dataFilename)))
      writePipe.on('finish', resolve);
      writePipe.on('error', e => { reject(e) });
    }
  }
});

gulp.task('build', ['data'], function (cb) {
  exec('bundle exec jekyll build', (error, stdout, stderr) => {
    if (error) {
      return cb(error);
    } else if (stdout) {
      log('Build: Standard output (jekyll build):\n' + `${stdout}`);
    } else if (stderr) {
      log.error(`Build: Standard error (jekyll build): ${stderr}`);
    }
    cb();
  });
});

gulp.task('watch', ['data'], function () {
  spawn('bundle', ['exec', 'jekyll', 'build', '--watch'], { stdio: 'inherit' });
});

gulp.task('serve', ['watch'], function () {
  bs.init({
    host: '0.0.0.0',
    files: '_site/**',
    server: '_site',
    notify: false
  });
});

gulp.task('deploy', ['build'], function (cb) {
  const siteDir = '_site';
  const rsyncSource = siteDir + '/';
  const rsyncDest = 'jptacek@hosting.med.upenn.edu:/home/neuroaesthetics/web_docs'
  log(`Deploy: Attempting rsync -ahzP --delete ${rsyncSource} ${rsyncDest}`);
  exec(`rsync -ahzP --delete ${rsyncSource} ${rsyncDest}`, (error, stdout, stderr) => {
    if (error) {
      // currently syncs successfully but throws error related to ownership of web_docs
      return cb(error);
    } else if (stdout) {
      log('Deploy: Standard output (rsync):\n' + `${stdout}`);
    } else if (stderr) {
      log.error(`Deploy: Standard error (rsync): ${stderr}`);
    }
    log('Deploy: Command successful (rsync)');
    cb();
  });
})

gulp.task('default', ['serve']);
