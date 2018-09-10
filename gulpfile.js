// REQUIRE ---------------------------------------------------------------------

// core
var gulp = require('gulp');
var spawn = require('child_process').spawn;
var bs = require('browser-sync').create();

var child_jk_watch; // needs to be global so we can kill later

var jk_build_command = [
  'bundle',
  'exec',
  'jekyll',
  'build'
];

var jk_watch_command = jk_build_command.concat('--watch');

gulp.task('build', function () {
  spawn(jk_build_command[0], jk_build_command.slice(1), { stdio: 'inherit' });
});

gulp.task('watch', function () {
  spawn(jk_watch_command[0], jk_watch_command.slice(1), { stdio: 'inherit' });
});

gulp.task('serve', ['watch'], function () {
  bs.init({
    host: '0.0.0.0',
    files: '_site/**',
    server: '_site',
    notify: false
  });
});

gulp.task('default', ['serve']);
