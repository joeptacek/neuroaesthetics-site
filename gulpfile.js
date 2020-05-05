// TODO minify css and js
// TODO pipeline to automate resizing, optimize images, generate responsive html elements
// TODO use strict?

// builtin
const bs = require('browser-sync').create();
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const url = require('url');

// npm
const gulp = require('gulp');
const del = require('del');
const mkdirp = require('mkdirp'); // no longer required in Node 10 and up?
const log = require('fancy-log');
const puppeteer = require('puppeteer');
const browserify = require('browserify');
const gm = require('gray-matter');

const args = process.argv;
const production = args.includes('deploy') || args.includes('--production');
if (production) {
  process.env['JEKYLL_ENV'] = 'production';
  log('JEKYLL_ENV set to "production"');
} else {
  process.env['JEKYLL_ENV'] = 'development';
  log('JEKYLL_ENV set to "development"');
}

function freejazz(cb) {
  // clean output dir
  const outputDir = '_includes/partials/jazzicon';
  del([outputDir + '/']).then(delPaths => {
    if (delPaths.length > 0) {
      log(`Freejazz: Cleaned ${outputDir}`);
    }
    mkdirp(outputDir).then(made => {
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
        log('Freejazz: Launched puppeteer browser');

        const page = await browser.newPage();
        // page.on('console', msg => log('PAGE LOG:', msg.text())); // debugging
        await page.goto(url.pathToFileURL('_puppeteer/root/index.html').toString());
        log('Freejazz: Loaded _puppeteer/root/index.html');

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

      // use browserify to create bundle.js from index.js
      browserify('_puppeteer/root/index.js')
        .bundle()
        .pipe(fs.createWriteStream('_puppeteer/root/bundle.js')) // need to del or otherwise deal with existing?
        .on('finish', () => {
          // run puppeteer
          puppeteerTasks();
      });
    }).catch(mkdirpError => {
      cb(mkdirpError);
    });
  }).catch(delError => {
    cb(delError)
  });
}

function jekyll() {
  return spawn('bundle', ['exec', 'jekyll', 'build'], { stdio: 'inherit' });
}

function serve(cb) {
  bs.init({
    host: '0.0.0.0',
    files: '_site/**',
    server: '_site',
    notify: false,
    ghostMode: false
  }, cb());
}

function watch() {
  gulp.watch(
    [
      '_data/**', '!_data/news.json',
      '_docs/**',
      '_includes/**', '!_includes/partials/jazzicon/**',
      '_layouts/**',
      '_pages/**',
      'assets/**',
      '_config.yml',
      'favicon.ico'
    ],
    jekyll
  );
  gulp.watch(
    [
      '_data/news.json',
      '_announcements/**',
      '_events/**',
    ],
    gulp.series(freejazz, jekyll)
  );
}

function rsync() {
  // do ssh-keygen and copy public key to server to do rsync w/o password
  const rsyncSource = '_site/';
  const rsyncDest = 'neuroaesthetics@hosting.med.upenn.edu:/home/neuroaesthetics/web_docs'
  log(`Deploy: Attempting rsync -ahzP --delete -e ssh ${rsyncSource} ${rsyncDest}`);
  return spawn('rsync', ['-ahzP', '--delete', '-e', 'ssh', rsyncSource, rsyncDest], { stdio: 'inherit' });
}

const build = gulp.series(freejazz, jekyll);

exports.build = build;
exports.deploy = gulp.series(build, rsync);
exports.default = gulp.series(build, serve, watch);
