const gulp = require('gulp');
const bs = require('browser-sync').create();
const { spawn, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const del = require('del');
const mkdirp = require('mkdirp');
const log = require('fancy-log');

gulp.task('data', function (cb) {
  const dataURLs = [
    'https://raw.githubusercontent.com/joeptacek/chatlab-site/master/_data/news.json',
    'https://raw.githubusercontent.com/joeptacek/chatlab-site/master/_data/publications.json'
  ]

  // rm -rf _data/ && mkdir _data
  // fs.rmdir will error if non-empty, best to use del (or rimraf) module for rm -rf
  // add trailing slash to remove matching dirs while ignoring files
  const outputDir = '_data/external'
  del([outputDir + '/']).then(delPaths => {
    mkdirp(outputDir, error => {
      if (error) {
        return cb(error);
      }

      if (delPaths.length > 0) {
        log(`Data: Cleaned ${outputDir}`);
      }

      const proms = dataURLs.map(dataURL => {
        return new Promise((resolve, reject) => {
          writeGet(dataURL, resolve, reject);
        });
      })

      Promise.all(proms).then(() => cb()).catch(reason => {
        processResponse = false;
        return cb(reason);
      });
    });
  }).catch(delError => {
    cb(delError)
  });

  let processResponse = true;
  function writeGet(dataURL, resolve, reject) {
    const urlBasename = dataURL.substring(dataURL.lastIndexOf("/") + 1);
    log(`Data: Requesting ${dataURL}`);
    https.get(dataURL, res => {
      if (processResponse) {
        log(`Data: Received response from ...${urlBasename}`);
        const { statusCode } = res;
        const contentLength = res.headers['content-length'];
        const maxContentLength = 5000000;

        let resError;
        if (statusCode !== 200) {
          resError = new Error(`Data: Response issue for ...${urlBasename}. Wrong status, ${statusCode}`);
        } else if ( contentLength > maxContentLength ) {
          resError = new Error(`Data: Response issue for ...${urlBasename}. Too large, ${contentLength} B`);
        }

        if (resError) {
          // consume response data to free up memory (necessary? included in node docs for http)
          res.resume();
          return reject(resError);
        }

        const outputPath = path.join(outputDir, urlBasename);
        const outputFile = fs.createWriteStream(outputPath);

        log(`Data: Writing ${contentLength} B to ${outputDir}/${urlBasename}`);
        res.pipe(outputFile).on('finish', resolve);
      } else {
        log(`Data: Received response for ...${urlBasename}, but aborting due to error`)
      }
    }).on('error', e => {
      reqError =  new Error(`Data: Request issue for ${urlBasename}, got \`${e.message})\``);
      return reject(reqError);
    });
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
