// TODO use strict?

// builtin
const { spawn } = require('child_process');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const url = require('url');

// general
const gulp = require('gulp');
const bs = require('browser-sync').create();
const del = require('del');
const log = require('fancy-log');
const cache = require('gulp-cached');

// freejazz
const puppeteer = require('puppeteer');
const browserify = require('browserify');
const gm = require('gray-matter');

// styles
const postcss = require('gulp-postcss');
const atImport = require('postcss-import');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// scripts
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

// images
const responsive = require('gulp-responsive');

// args
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
  const outputDir = '_includes/partials/jazzicon/';
  del([outputDir]).then(delPaths => {
    if (delPaths.length > 0) {
      log(`Freejazz: Cleaned ${outputDir}`);
    }
    fsp.mkdir(outputDir).then(made => {
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
        log('Freejazz: Wrote data to _puppeteer/root/data.json');

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
          log('Freejazz: Scraped jazzicons to ' + path.join(dest, subfolder) + '/');
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
    }).catch(mkdirError => {
      cb(mkdirError);
    });
  }).catch(delError => {
    cb(delError)
  });
}

function clean() {
  return del([
    '_site/assets/css/**',
    '_site/assets/js/**',
    '_site/assets/img/responsive/**'
  ]);
}

function css() {
  // import tachyons.css into main.css, autoprefix, minify
  return gulp.src('_assets/css/main.css')
    .pipe(postcss([
      atImport(),
      autoprefixer(),
      cssnano()
    ]))
    .pipe(gulp.dest('_site/assets/css'));
}

function js() {
  return gulp.src('_assets/js/**')
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(gulp.dest('_site/assets/js'));
}

function img() {
  // TODO: add WEBP
  return gulp.src('_assets/img/src/**')
    .pipe(cache('images')) // filters out images already processed
    .pipe(responsive(
      {
        'png/mw320/**': [
          {
            width: 320,
            rename: {
              suffix: '--320w',
              extname: '.png'
            }
          },
          {
            width: 320 * 2,
            rename: {
              suffix: '--640w',
              extname: '.png'
            }
          }
        ],
        'png/mw640/**': [
          {
            width: 320,
            rename: {
              suffix: '--320w',
              extname: '.png'
            }
          },
          {
            width: 320 * 2,
            rename: {
              suffix: '--640w',
              extname: '.png'
            }
          },
          {
            width: 320 * 4,
            rename: {
              suffix: '--1280w',
              extname: '.png'
            }
          }
        ],
        'jpg/mw320/**': [
          {
            width: 320,
            rename: {
              suffix: '--320w',
              extname: '.jpg'
            }
          },
          {
            width: 320 * 2,
            rename: {
              suffix: '--640w',
              extname: '.jpg'
            }
          }
        ],
        'jpg/mw1280/**': [
          {
            width: 320,
            rename: {
              suffix: '--320w',
              extname: '.jpg'
            }
          },
          {
            width: 320 * 2,
            rename: {
              suffix: '--640w',
              extname: '.jpg'
            }
          },
          {
            width: 320 * 4,
            rename: {
              suffix: '--1280w',
              extname: '.jpg'
            }
          },
          {
            width: 320 * 8,
            rename: {
              suffix: '--2560w',
              extname: '.jpg'
            }
          }
        ],
        'jpg/backgrounds/**': [
          // currently using background-image for backgrounds (not img element + imgsrc/sizes)
          // background-image allows background-size: cover, background-position: 50% 50%, etc.
          // however, can't automatically switch using w-descriptors + sizes (as w/ img element)
          // thus, switching sizes with media queries: default, medium (30em), large (60em)
          //
          // TODO: widths and media queries currently sort of arbitrary; best to optimize
          // ...maybe include 960w (640h for 1.5 aspect) for the shortest non-retina phones
          // ...maybe target `resolution` media feature
          {
            width: 1280,
            rename: {
              suffix: '--1280w',
              extname: '.jpg'
            }
          },
          {
            width: 1280 * 1.5,
            rename: {
              suffix: '--1920w',
              extname: '.jpg'
            }
          },
          {
            width: 1280 * 2,
            rename: {
              suffix: '--2560w',
              extname: '.jpg'
            }
          },
          {
            width: 1280,
            rename: {
              suffix: '--1280w',
              extname: '.webp'
            }
          },
          {
            width: 1280 * 1.5,
            rename: {
              suffix: '--1920w',
              extname: '.webp'
            }
          },
          {
            width: 1280 * 2,
            rename: {
              suffix: '--2560w',
              extname: '.webp'
            }
          }
        ]
      },
      {
        progressive: true,
        withoutEnlargement: false, // OK to enlarge
        errorOnUnusedConfig: false, // when gulp-cached filters unchanged
        quality: 80, // default
        withMetadata: false // default
      }
    ))
    .pipe(gulp.dest('_site/assets/img/responsive'));
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
  gulp.watch('_assets/img/src/**', img);
  gulp.watch('_assets/css/**', css);
  gulp.watch('_assets/js/**', js);
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

// TODO: maybe move freejazz into parallel with css, js, img (make more async first)
const html = gulp.series(freejazz, jekyll);
const build = gulp.series(clean, gulp.parallel(css, js, img), html);

exports.build = build;
exports.deploy = gulp.series(build, rsync);
exports.default = gulp.series(build, serve, watch);
