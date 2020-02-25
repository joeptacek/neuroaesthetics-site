// TODO REFACTOR GULPFILE FOR GULP 4 / NODE 10
// TODO retire old code related to data requests from GitHub
// TODO minify css and js
// TODO pipeline to automate resizing, optimize images, generate responsive html elements

// builtin
const bs = require('browser-sync').create();
const { spawn, exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// npm
const gulp = require('gulp');
const del = require('del');
const mkdirp = require('mkdirp'); // no longer required in Node 10 and up?
const log = require('fancy-log');
const puppeteer = require('puppeteer'); // uses chromium in node_modules, the presence of which causes some errors with jekyll-watch
const browserify = require('browserify');
const gm = require('gray-matter');

const args = process.argv;
const devLocalData = args.includes('--local');
const production = args.includes('--production') || args.includes('deploy');
let jekyllBuildExec, jekyllWatchSpawn;
if (!production) {
  process.env['JEKYLL_ENV'] = 'development';
  jekyllBuildExec = 'bundle exec jekyll build';
  jekyllWatchSpawn = ['exec', 'jekyll', 'build', '--watch'];
} else {
  if (!devLocalData) {
    process.env['JEKYLL_ENV'] = 'production';
    jekyllBuildExec = 'bundle exec jekyll build';
    jekyllWatchSpawn = ['exec', 'jekyll', 'build', '--watch'];
  } else {
    throw new Error('Cannot use `--local` with `--production` or `deploy`');
  }
}

gulp.task('data', function (cb) {
  // TODO add option to just use the last request from GitHub, if it exists
  const dataFilenames = ['news.json', 'publications.json']
  const remoteDataSource = 'https://raw.githubusercontent.com/joeptacek/chatlab-site/master/_data/'
  const localDataSource = '../chatlab-site/_data/';
  const outputDir = '_data/external'
  let httpError = false; // TODO comment for this, more comments in general

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
    function writeFromRemote(dataFilename, resolve, reject) {
      const dataSourceURL = url.resolve(remoteDataSource, dataFilename);
      log(`Data: Requesting ${dataFilename}`);
      https.get(dataSourceURL, res => {
        if (httpError) {
          // TODO explain httpError
          log(`Data: Received response for... ${dataFilename}, but aborting due to error`)
        } else {
          log(`Data: Received response fom... ${dataFilename}`);
          const { statusCode } = res;
          const contentLength = res.headers['content-length'];
          const maxContentLength = 5000000;
          let resError;
          if (statusCode !== 200) {
            resError = new Error(`Data: Response error for... ${dataFilname}. Wrong status, ${statusCode}`);
          } else if ( contentLength > maxContentLength ) {
            resError = new Error(`Data: Response error for... ${dataFilename}. Too large, ${contentLength} B`);
          }
          if (resError) {
            res.resume(); // consume response data to free up memory (necessary?)
            return reject(resError); // error related to response from https.get
          }
          log(`Data: Writing ${contentLength} B to ${outputDir}/${dataFilename}`);
          writePipe = res.pipe(fs.createWriteStream(path.join(outputDir, dataFilename)));
          writePipe.on('finish', resolve);
          writePipe.on('error', e => { reject(e) });
        }
      }).on('error', e => {
        reqError =  new Error(`Data: Request error for ${dataFilename}. \`${e.message})\``);
        return reject(reqError); // http.get error
      });
    }

    const proms = dataFilenames.map(dataFilename => {
      return new Promise((resolve, reject) => {
        writeFromRemote(dataFilename, resolve, reject);
      });
    })

    Promise.all(proms).then(() => cb()).catch(reason => {
      httpError = true;
      return cb(reason);
    });
  }

  function writeAllFromLocal() {
    function writeFromLocal(dataFilename, resolve, reject) {
      // TODO catch errors with createReadStream e.g., if localDataSource doesn't exist
      writePipe = fs.createReadStream(path.join(localDataSource, dataFilename)).pipe(fs.createWriteStream(path.join(outputDir, dataFilename)))
      writePipe.on('finish', resolve);
      writePipe.on('error', e => { reject(e) });
    }

    const proms = dataFilenames.map(dataFilename => {
      return new Promise((resolve, reject) => {
        writeFromLocal(dataFilename, resolve, reject);
      });
    })

    Promise.all(proms).then(() => cb()).catch(reason => {
      return cb(reason);
    });
  }
});

gulp.task('freejazz', function(cb) {
  // clean output dir
  const outputDir = '_includes/partials/jazzicon';
  del([outputDir + '/']).then(delPaths => {
    mkdirp(outputDir, error => {
      if (error) {
        return cb(error); // mkdirp error
      } else {

        // use puppeteer to load/scrape jazzicons generated from Jekyll data/collections
        async function puppeteerTasks() {

          // an array of objects (with titles) for news, announcements, events in allJSON
          const allJSON = {};

          // add news data from JSON file to allJSON
          allJSON['news'] = JSON.parse(fs.readFileSync('_data/news.json')); // TODO use async file operations here and elsewhere below

          // take a path to Jekyll collection and return an array containing a front matter object for each file
          function getCollectionArray(collectionPath) {
            const collectionItems = fs.readdirSync(collectionPath);
            return collectionItems.map(item => {
              const collectionFile = fs.readFileSync(path.join(collectionPath, item));
              const frontMatterJSON = gm(collectionFile).data;
              return frontMatterJSON;
            })
          }

          // convert Jekyll collections to arrays and add to allJSON
          ['_announcements', '_events'].forEach(collection => {
            allJSON[collection.slice(1)] = getCollectionArray(collection);
          });

          // write allJSON to data.json
          fs.writeFileSync('_puppeteer/root/data.json', JSON.stringify(allJSON));
          log('Freejazz: Wrote data.json to _puppeteer/root')

          // launch puppeteer and load index.html
          // TODO maybe handle rejected promises for the following awaits
          const browser = await puppeteer.launch({
            args: ['--allow-file-access-from-files'], // to allow XMLHttpRequest from puppeteer to local file system for news.json (avoid CORS errors)
            // headless: false // debugging
          });
          log('Freejazz: Launched puppeteer browser')
          const page = await browser.newPage();
          // page.on('console', msg => console.log('PAGE LOG:', msg.text())); // debugging
          await page.goto(url.pathToFileURL('_puppeteer/root/index.html').toString());
          log('Freejazz: Loaded _puppeteer/root/index.html')
          await page.screenshot({
            path: '_puppeteer/screenshot.png', // need to del or otherwise deal with existing?
            fullPage: true
          });
          log('Freejazz: Saved screenshot to _puppeteer/screenshot.png');

          // scrape jazzicon elements from in index.html to _partials
          async function scrapeJazzicons(query, subfolder) {
            const dest = '_includes/partials/jazzicon/';
            const jazzicons = await page.$$(query); // any need to eventually dispose() of jazzicons?
            fs.mkdirSync(path.join(dest, subfolder));
            for (i = 0; i < jazzicons.length; i++) {
              const divHTML = await page.evaluate(el => el.outerHTML, jazzicons[i]);
              const divId = await page.evaluate(el => el.id, jazzicons[i]); // div id should be the slug of the news article title used to generate the jazzicon
              fs.writeFileSync(path.join(dest, subfolder, divId + '.html'), divHTML);
            }
            log('Freejazz: Scraped jazzicons to ' + path.join(dest, subfolder));
          }

          // scrape news, announcements, events
          await scrapeJazzicons('#news-jazzicons > div', 'news');
          await scrapeJazzicons('#announcements-jazzicons > div', 'announcements');
          await scrapeJazzicons('#events-jazzicons > div', 'events');

          await browser.close(); // comment out to debug
          log('Freejazz: Closed puppeteer browser');
          cb();
        }

        if (delPaths.length > 0) {
          log(`Freejazz: Cleaned ${outputDir}`);
        }

        // use browserify to create bundle.js from index.js
        browserify('_puppeteer/root/index.js')
          .bundle()
          .pipe(fs.createWriteStream('_puppeteer/root/bundle.js')) // need to del or otherwise deal with existing?
          .on('finish', () => {
            // run puppeteer
            puppeteerTasks();
        });
      }
    });
  }).catch(delError => {
    cb(delError) // del error
  });
});

gulp.task('build', ['freejazz'], function (cb) {
  exec(jekyllBuildExec, (error, stdout, stderr) => {
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

gulp.task('watch', ['freejazz'], function () {
  spawn('bundle', jekyllWatchSpawn, { stdio: 'inherit' });
  // jekyll-watch uses 'listen' gem, which throws (non-fatal) "duplicate directory" errors when a watched dir contains symlinks (e.g., in node_modules/puppeteer/.local-chromium); doesn't help to add 'node_modules' to jekyll exclude list
  // maybe watch and rebuild jekyll using gulp watch instead of jekyll-watch?
  // TODO build out cb() to make dependent tasks (e.g., serve) wait until jekyll watch is finished
});

// serve won't actually wait on watch b/c no cb()
gulp.task('serve', ['watch'], function () {
  bs.init({
    host: '0.0.0.0',
    files: '_site/**',
    server: '_site',
    notify: false,
    ghostMode: false
  });
});

gulp.task('deploy', ['build'], function (cb) {
  const siteDir = '_site';
  const rsyncSource = siteDir + '/';
  // do ssh-keygen and copy public key to server to do rsync w/o password
  const rsyncDest = 'neuroaesthetics@hosting.med.upenn.edu:/home/neuroaesthetics/web_docs'
  log(`Deploy: Attempting rsync -ahzP --delete ${rsyncSource} ${rsyncDest}`);
  exec(`rsync -ahzP --delete -e ssh ${rsyncSource} ${rsyncDest}`, (error, stdout, stderr) => {
    if (error) {
      // currently syncs successfully but throws error related to ownership of web_docs
      return cb(error);
    } else if (stdout) {
      log('Deploy: Standard output (rsync):\n' + stdout);
    } else if (stderr) {
      log.error('Deploy: Standard error (rsync):\n' + stderr);
    }
    log('Deploy: Command successful (rsync)');
    cb();
  });
})

gulp.task('default', ['serve']);
