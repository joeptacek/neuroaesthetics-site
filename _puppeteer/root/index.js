// jazzicon is intended to run in a client browser, using browserify to bundle required modules
// jazzicon doesn't work directly in node; it can't return an SVG element unless there's some type of DOM (is this still true after jazzicon removed raphael?)
// can use puppeteer/Chromium to run jazzicon in a headless browser and then scrape serialized results for use as Jekyll includes
// more difficult to run browserify'd jazzicon functions "from outside" of puppeteer, e.g., using page.evaluate(pageFunction, args)
// easier to generate jazzicons here in index.js; however, need to pull data in using an AJAX request for local data.json
// p.s. alternatives to puppeteer: to avoid running a full browser/DOM, could use an SVG library to implement jazzicon, e.g., bonsai.js, svg.js + svgdom; jsdom can't (?) handle SVG by itself, without other workarounds

const jazzicon = require('jazzicon');
const crypto = require('crypto');

// url-slug seems more compatible with jekyll's slugify out of the box; however, url-slug fragments camelcased words, e.g., PCfN becomes pcf-n, so need to say PCFN in titles
const urlslug = require('url-slug');

// request data.json (contains an array of objects with titles for news, announcements, events)
function loadJSON(cb) {
  const xobj = new XMLHttpRequest();
  xobj.overrideMimeType('application/json'); // is this necessary?
  xobj.open('GET', 'data.json'); // browser will throw CORS errors when requesting something from the local filesystem unless Chromium is opened with `--allow-file-access-from-files`
  xobj.onreadystatechange = () => {
    if (xobj.readyState == 4) {
      // readyState 4 is DONE (could be either successfully received or failed)
      cb(xobj.responseText); // return responseText
    }
  };
  xobj.send(); // send async request
}

// use titles from an array of objtects to generate jazzicon children for an element with id=targetId
function addJazzicons(inputJSON, targetId) {
  for (i = 0; i < inputJSON.length; i++) {
    const title = inputJSON[i].title;
    const hash = crypto.createHash('md5');
    const hex = hash.update(title).digest('hex'); // convert title to md5 hash
    const int = parseInt(hex.substring(0, 10), 16); // truncate hex to reduce magnitude for jazzicon, convert to int
    const diameter = 150; // jazzicon versions earlier than 2.0.0 don't allow diameter > 100
    const div = jazzicon(diameter, int);
    div.id = urlslug(title); // use url-slug of title to set id so that Jekyll can find this later by using the slugify filter on the same title
    div.style.borderRadius = '9999px'; // jazzicon uses constant 50px for border-radius property; doesn't result in circles if diameter > 100px
    document.getElementById(targetId).appendChild(div);
  }
}

loadJSON(resp => {
  // TODO handle response error
  const parsedJSON = JSON.parse(resp);
  // generate jazzicons for news, annoubncements, events
  addJazzicons(parsedJSON.news, 'news-jazzicons');
  addJazzicons(parsedJSON.announcements, 'announcements-jazzicons');
  addJazzicons(parsedJSON.events, 'events-jazzicons');
});
