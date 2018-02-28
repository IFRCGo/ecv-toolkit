var gulp = require('gulp');

var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var cp = require('child_process');
var fs = require('fs');
var plumber = require('gulp-plumber');
var request = require('request');
var runSequence = require('run-sequence').use(gulp);
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');  

// Copy from the .tmp to _site directory.
// To reduce build times the assets are compiles at the same time as jekyll
// renders the site. Once the rendering has finished the assets are copied.
gulp.task('copy:assets', function(done) {
  return gulp.src('.tmp/assets/**')
    .pipe(gulp.dest('_site/assets'));
});


var sassInput = 'app/assets/styles/*.scss';
var sassOptions = {
  includePaths: ['node_modules/foundation-sites/scss','node_modules/font-awesome/scss'],
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
  return gulp.src('node_modules/font-awesome/fonts/**.*')
    .pipe(gulp.dest('.tmp/assets/fonts'));
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
  runSequence('clean', 'get-humans', 'build', 'pdfs', done);
});

// Removes jekyll's _site folder
gulp.task('clean', function() {
  return gulp.src(['_site', '.tmp'], {read: false})
    .pipe(clean());
});


// Helper functions 
// ----------------

function browserReload() {
  if (shouldReload) {
    browserSync.reload();
  }
}

// Pdfs task 
// ---------

gulp.task('pdfs', function() {

// TODO: need to make this happen  
// ==============================

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

    request(options, function (err, res) {
      var humans = JSON.parse(res.body).map(function(human){
        return {login: human.login, html_url: human.html_url, contributions: human.contributions}
      });
      humans.sort(function(a,b){
        return b.contributions - a.contributions;
      })
      callback(humans);
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
