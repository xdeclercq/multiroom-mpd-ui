var gulp = require('gulp');

var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var rimraf = require('gulp-rimraf');
var uglify = require('gulp-uglify');
var ngTemplates = require('gulp-angular-templates');
var inject = require('gulp-inject');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var addSrc = require('gulp-add-src');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var plumber = require('gulp-plumber');
var jsonProxy = require('json-proxy');
var browserSync = require('browser-sync');
var connectBrowserSync = require('connect-browser-sync');
var webserver = require('gulp-webserver');

var paths = {
  html: 'src/index.html',
  templates: 'src/**/*.tpl.html',
  vendorJs: ['vendor/angular/angular.js',
      'vendor/angular-ui-router/release/angular-ui-router.js',
      'vendor/angular-ui-utils/modules/route/route.js',
      'vendor/angular-foundation/mm-foundation-tpls.min.js',
      'vendor/rfc6570.js',
      'vendor/angular-hal/angular-hal.js',
      'vendor/angular-websocket/angular-websocket.js',
      'vendor/atmosphere/atmosphere.js'],
  sass: 'src/app/app.scss',
  css: 'vendor/raleway/raleway.css',
  fonts: ['vendor/fontawesome/fonts/*.{eot,svg,ttf,woff}', 'vendor/raleway/fonts/**/*.{eot,svg,ttf,woff}'],
  appJs: 'src/**/*.js'
};

gulp.task('default', ['server','watch', 'css', 'vendor-js', 'app-js', 'templates', 'html']);

function injectFile(filename, path, tag) {
  return inject(
    gulp.src(filename, {
      cwd: path,
      read: false
    }), {
      starttag: '<!-- inject:' + tag + ':{{ext}} -->',
      relative: true,
      ignorePath: '../dist/'
    }
  );
}

gulp.task('templates', function() {
  return gulp.src(paths.templates)
    .pipe(ngTemplates({module: 'multiroom'}))
    .pipe(uglify())
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(livereload());
});

gulp.task('html', ['css', 'vendor-js', 'app-js', 'templates'], function() {
  return gulp.src(paths.html)
    .pipe(injectFile('app.min.css', 'dist/css', 'app-style'))
    .pipe(injectFile('vendor.js', 'dist/js', 'vendor'))
    .pipe(injectFile('app.js', 'dist/js', 'app'))
    .pipe(injectFile('templates.js', 'dist/js', 'templates'))
    .pipe(gulp.dest('dist'))
    .pipe(livereload());
});

gulp.task('css', ['fonts'], function() {
  return gulp.src(paths.sass)
    .pipe(plumber())
    .pipe(sass({ 
      style: 'expanded', 
      includePaths: ['vendor/foundation/scss', 'vendor/fontawesome/scss']
    }))
    .pipe(addSrc(paths.css))
    .pipe(replace("'./fonts/", "'../fonts/"))
    .pipe(minifyCss())
    .pipe(concat('app.min.css'))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist/css'))
    .pipe(livereload());
});

gulp.task('lint', function() {
  return gulp.src(paths.appJs)
    .pipe(jshint())
    .pipe(jshint.reporter(require('jshint-stylish')))
    .pipe(jshint.reporter('fail'));
});

gulp.task('clean', function() {
  return gulp.src('dist', { read: false })
 		.pipe(rimraf({force: true}));
});

gulp.task('app-js', ['lint'], function() {
  return gulp.src(paths.appJs)
//    .pipe(uglify())
    .pipe(concat('app.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(livereload());
});

gulp.task('vendor-js', function() {
  return gulp.src(paths.vendorJs)
    .pipe(uglify())
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(livereload());
});

gulp.task('fonts', function() {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch(paths.less, ['css']);
  gulp.watch(paths.appJs, ['app-js']);
  gulp.watch(paths.html, ['html']);
  gulp.watch(paths.templates, ['templates']);
  gulp.watch('**/*.scss', ['css']);
});

gulp.task('server', function() {
  connect.server({
    root: ['dist'],
    port: 9000,
    //livereload: true,
    middleware: function(connect, opt) {
      return [
        //connectBrowserSync(browserSync()),
        jsonProxy.initialize({
          proxy: {
            forward: {
              '/multiroom-mpd/api/': 'http://localhost:8080'
            },
            headers: {
              'X-Forwarded-Host': function(req) {
                console.log('req.headers.host: ' + req.headers.host);
                return req.headers.host;
              }
            }
          }
        })
      ];
    }
  });
});

gulp.task('webserver', function() {

  gulp.src('dist')
    .pipe(webserver({
      port: 9000,
      livereload: true,
      open:true,
      proxies: [{
        source: '/multiroom-mpd/api/',
        target: 'http://localhost:8080'
      }]
    }));
});