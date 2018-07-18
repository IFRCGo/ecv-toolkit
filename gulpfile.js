var gulp = require('gulp');

var archiver = require('archiver');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var cp = require('child_process');
var dir = require('node-dir');
var fs = require('fs');
var gls = require('gulp-live-server');
var lineReplace = require('line-replace');
var path = require('path');
var plumber = require('gulp-plumber');
var puppeteer = require('puppeteer');
var queue = require('d3-queue');
var request = require('request');
var readline = require('readline');
var runSequence = require('run-sequence').use(gulp);
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var async = require("async");
var doWhilst =require('async/doWhilst');

// Copy from the .tmp to _site directory.
// To reduce build times the assets are compiles at the same time as jekyll
// renders the site. Once the rendering has finished the assets are copied.
gulp.task('copy:assets', function() {

  switch (environment) {
    case 'android':
      return gulp.src('.tmp/assets/**')
        .pipe(gulp.dest('_android/www/assets'));
    break;
    default:
      return gulp.src('.tmp/assets/**')
        .pipe(gulp.dest('_site/assets'));
    break;
  }

});

gulp.task('copy:config', function() {

  return gulp.src('./config.xml')
    .pipe(gulp.dest('_android'));

});

gulp.task('copy:app-icons', function() {

  return gulp.src('./app-icons/res/**')
    .pipe(gulp.dest('_android/res/'));

});


var sassInput = 'app/assets/styles/*.scss';
var sassOptions = {
  includePaths: ['node_modules/foundation-sites/scss','node_modules/@fortawesome/fontawesome-free/scss'],
  errLogToConsole: true,
  outputStyle: 'expanded'
};
var autoprefixerOptions = {
  browsers: ['last 2 versions', 'ie >= 9', 'Android >= 2.3', 'ios >= 7']
};

// TODO: clean this up
// ===================
gulp.task('sass', function() {
  return gulp.src(sassInput)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(sourcemaps.write('.'))
    // .pipe($.if(isProduction, uglify({ mangle: false })))
    // .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(browserSync.reload({stream:true}))
    .pipe(gulp.dest('.tmp/assets/styles'));
});

gulp.task('fonts', function() {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/**.*')
    .pipe(gulp.dest('.tmp/assets/webfonts'));
});

var javascriptPaths = [
  // the order of these matter
  "node_modules/jquery/dist/jquery.js",
  "node_modules/what-input/what-input.js",
  // "node_modules/foundation-sites/dist/js/foundation.js",
  "node_modules/foundation-sites/dist/js/plugins/foundation.core.js",
  "node_modules/foundation-sites/dist/js/plugins/foundation.util.mediaQuery.js",
  "node_modules/foundation-sites/dist/js/plugins/foundation.util.imageLoader.js",
  // https://foundation.zurb.com/sites/docs/equalizer.html#javascript-reference
  "node_modules/foundation-sites/dist/js/plugins/foundation.equalizer.js"

]

// TODO: clean this up
// ===================
gulp.task('javascripts', function() {
  // # https://github.com/Foundation-for-Jekyll-sites/jekyll-foundation/blob/master/gulp/tasks/javascript.js
  return gulp.src(javascriptPaths)
    // .pipe(sourcemaps.init())
    // .pipe(babel())
    .pipe(concat('vendor.min.js'))
    .pipe(uglify({ mangle: false }))
    // .pipe($.if(isProduction, uglify({ mangle: false })))
    // .pipe($.if(!isProduction, $.sourcemaps.write()))
    // Write the file to source dir and build dir
    .pipe(gulp.dest('.tmp/assets/js'))
});

// Build the jekyll website.
gulp.task('jekyll', function (done) {
  var args = ['exec', 'jekyll', 'build'];

  switch (environment) {
    case 'development':
      args.push('--config=_config.yml,_config-dev.yml');
    break
    case 'android':
      args.push('--config=_config.yml,_config-android.yml');
    break;
    case 'production':
      args.push('--config=_config.yml');
    break;
  }

  return cp.spawn('bundle', args, {stdio: 'inherit'})
    .on('close', done);
});

// Build the jekyll website. Reload all the browsers.
gulp.task('jekyll:rebuild', ['jekyll'], function () {
  browserSync.reload();
});

gulp.task('build', function(done) {
  runSequence(['jekyll', 'sass', 'javascripts', 'fonts'], ['copy:assets'], done);
});

// Default task.
gulp.task('default', function(done) {
  runSequence('build', done);
});

gulp.task('serve', ['build'], function () {
  browserSync({
    port: 3000,
    server: {
      baseDir: ['.tmp', '_site']
    }
  });

  // TODO: clean this up
  // ===================
  var watching = [
    'app/**/*.html',
    'app/**/*.yml',
    'app/**/*.md',
    '_config*',
    // './app/assets/scripts/*.js',
    './app/assets/styles/*.scss'
  ]
  gulp.watch(watching, function() {
    runSequence('build', browserReload);
  });

});

var shouldReload = true;
gulp.task('no-reload', function(done) {
  shouldReload = false;
  runSequence('serve', done);
});

var environment = 'development';
gulp.task('prod', function(done) {
  environment = 'production';
  runSequence('clean', 'get-humans', 'build', 'pdfs', 'android', done);
});
gulp.task('android', function(done) {
  environment = 'android';
  runSequence('build', 'modify-links', 'copy:config', 'copy:app-icons', done);
});

// Removes jekyll's _site folder
gulp.task('clean', function() {
  return gulp.src(['_site', '_android', '.tmp'], {read: false})
    .pipe(clean());
});


// Helper functions
// ----------------

function browserReload() {
  if (shouldReload) {
    browserSync.reload();
  }
}

// android webview
// ---------------

var replacements = [];
var filecount = 0;
var processedcount = 0;

// all page links need an 'index.html' added to the end
gulp.task('modify-links', function(done) {

  function processFile(file, cb) {
    var myfile = file;
    var linecount = 0;
    var rl = readline.createInterface({
      input: fs.createReadStream(myfile),
      crlfDelay: Infinity
    });

    rl.on('line', function(line) {
      linecount++;
      let firstIndex = line.indexOf('href="');
      if( firstIndex !== -1 ) {
        hrefClosure = line.indexOf('"', firstIndex+6 );
        if( line.substr(firstIndex, hrefClosure).indexOf('.css') == -1 ) {
          let output = line.substr(0, hrefClosure) + 'index.html' + line.substr(hrefClosure);
          replacements.push({ "file": myfile,
                              "line": linecount,
                              "text": output,
                              "addNewLine": true,
                              "callback": null })
        }
      }

    });
    rl.on('close', function() {
      processedcount++;
      if ( processedcount === filecount) {
        var processQueue = queue.queue(1);
        replacements.forEach( function(replaceObj) {
          processQueue.defer(replaceLine, replaceObj);
        })
        processQueue.awaitAll(function(error, files) {
          if (error) throw error;
          done();
        });
      }
    })
  }

  function replaceLine(item, cb) {
    item["callback"] = function(data){ cb(null, data); };
    lineReplace(item);
  }

  dir.files('_android/',function(err,files){
    if (err) throw err;
    for( var i = 0; i < files.length; i++ ) {
      if ( path.extname(files[i]) == ".html" ) {
        filecount++;
        processFile(files[i])
      }
    }
  });

});


// Pdfs task
// ---------
var myserver = gls.static('_site', 3000);
gulp.task('webserver-start', function() {
  myserver.start();
});
gulp.task('webserver-stop', function() {
  myserver.stop();
});

gulp.task('print', function(done) {

  // create a variable to hold language directory paths, so we can find and zip them
  var languages = [];
  fs.mkdirSync('.tmp/pdf/');
  // connect a headless browser to the local server run with `gulp-live-server`
  // and use it to "print" PDFs
  function printUrl(json, cb) {
    (async () => {
      // var filename = json.url.slice(0,-1).split("/").pop();   // not using this
      var filename = json.collectionName + ' - ' + json.identifier + ' - ' + json.slug + '.pdf';
      // to run headless Chrome on Travis, you must call launch() with flags to disable Chrome's sandbox
      const browser = await puppeteer.launch({args: ['--no-sandbox']});
      const page = await browser.newPage();
      await page.goto("http://localhost:3000"+json.url, {waitUntil: 'networkidle2'});
      // add the pdf to the same folder as the index.html file for that page
      await page.pdf({
        path: "./_site"+json.url+filename,
        format: 'A4'
      });
      // add the pdf to a tmp language folder, that we will zip when done
      await page.pdf({
        path: './.tmp/pdf/'+json.lang+"/"+filename,
        format: 'A4'
      });
      await browser.close();
      await cb();
    })();
  }

  function zipPdfs() {

    var zippedCount = 0;
    for(var i=0; i<languages.length; i++) {
      // create a file to stream archive data to.
      var output = fs.createWriteStream('_site/' + languages[i]['lang'] + '.zip');
      var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });
      // listen for all archive data to be written
      // 'close' event is fired only when a file descriptor is involved
      output.on('close', function() {
        zippedCount++;
        console.log(zippedCount+' archiver has been finalized and the output file descriptor has closed.');
        if(zippedCount == languages.length) {
          // zipping of a language folders are done so end the gulp task
          done();
        }
      });
      // This event is fired when the data source is drained no matter what was the data source.
      // It is not part of this library but rather from the NodeJS Stream API.
      // @see: https://nodejs.org/api/stream.html#stream_event_end
      output.on('end', function() {
        console.log('Data has been drained');
      });
      // good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          // log warning
        } else {
          // throw error
          throw err;
        }
      });
      // good practice to catch this error explicitly
      archive.on('error', function(err) {
        throw err;
      });
      // pipe archive data to the file
      archive.pipe(output);
      // append files from a sub-directory and naming it `new-subdir` within the archive
      archive.directory(languages[i]['dir'], languages[i]['lang']);
      // finalize the archive (ie we are done appending files but streams have to finish yet)
      // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
      archive.finalize();
    }
  }

  var json = JSON.parse(fs.readFileSync('./_site/pdfs.json', 'utf8'));
  var count = 0;
  var goal = json.length;
  // generate PDFs one at a time to avoid
  // > livereload[tiny-lr] listening on 35729 ...
  // > (node:87277) MaxListenersExceededWarning: Possible EventEmitter memory
  // > leak detected. 11 exit listeners added. Use emitter.setMaxListeners()
  // > to increase limit
  doWhilst(
    // ## iteratee
    // a function which is called each time test passes, invoked with (callback)
    function(cb) {
      var dir = '.tmp/pdf/'+ json[count].lang;
      if (!fs.existsSync(dir)){
        languages.push({"dir":dir, "lang":json[count].lang}); // the languages object stores data that we use to create zip archives later
        fs.mkdirSync(dir);
      }
      printUrl(json[count], function() {
        count++;
        console.log("generated PDF " + count + " of " + goal);
        cb();
      });
    },
    // ## test
    // synchronous truth test to perform after each execution of iteratee
    // invoked with any non-error callback results of iteratee
    function() {
      return count < goal;
    },
    // # callback
    // called after the test function has failed and repeated execution of iteratee has stopped
    // will be passed an error and any arguments passed to the final iteratee's callback
    function(err) {
      console.log('done generating PDFs.')
      zipPdfs();
    }
  )

});

gulp.task('pdfs', function(done) {
  runSequence('webserver-start','print','webserver-stop',done);
});



// Humans task
// -----------
gulp.task('get-humans', function(){
  var getHumans = function(callback){
    var options = {
      url: 'https://api.github.com/repos/IFRCGo/ecv-toolkit/contributors',
      headers: {
        'User-Agent': 'request'
      }
    };

    request(options, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        var humans = JSON.parse(res.body).map(function(human){
          return {login: human.login, html_url: human.html_url, contributions: human.contributions}
        });
        humans.sort(function(a,b){
          return b.contributions - a.contributions;
        })
        callback(humans);
      } else {
        callback([]);
      }
    });
  }

  getHumans(function(humans){
    fs.readFile('./humans-template.txt', 'utf8', function (err, doc) {
      if (err) throw err;
      for (i = 0; i < humans.length; i++) {
        doc = doc + '\nContributor: '+humans[i].login + '\nGithub: '+humans[i].html_url +'\n';
      }
      fs.writeFile('./app/humans.txt', doc, function(err) {
        if (err) throw err;
      });
    });
  });
});
