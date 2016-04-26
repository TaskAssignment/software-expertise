'use strict';

var gulp = require('gulp'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  request = require('request'),
  karmaServer = require('karma').Server,
  fs = require('fs'),
  path = require('path'),
  shell = require('shelljs');
var plugins = gulpLoadPlugins();

process.env.NODE_ENV = 'test';


gulp.task('nothing', ['e2e.startServer', 'e2e.stopServer']);

gulp.task('e2e.test', ['e2e.startServer', 'e2e.stopServer'], function(done){});

gulp.task('e2e.update', function(done){
  //Install/update webdriver requirements for Protractor e2e testing
  console.log('Protractor webdriver-manager update')
  var webdriverBin = path.join(require.resolve('protractor'), '../..', 'bin/webdriver-manager').normalize();
  shell.exec('node ' + webdriverBin + ' update', function (code, output) {
    console.log(output);
    if(code !== 0)
    {
      process.exit(code);
    }

    done();
  });
});

gulp.task('e2e.startServer', ['e2e.update'], function(done){
  var promise = require('../server.js');

  promise.then(function(app){done();});
});

gulp.task('e2e.runProtractor', ['e2e.startServer'], function(done){
  shell.exec('node node_modules/protractor/bin/protractor tests/config/e2e/protractor.config.js', function(code, output){
    done();
  });
});

gulp.task('e2e.stopServer', ['e2e.runProtractor'], function(){
  process.exit();
})


function processIncludes(aggregatedAssets) {
  for(var i = 0; i < aggregatedAssets.length; ++i) {
    aggregatedAssets[i] = aggregatedAssets[i].slice(1);
    if(aggregatedAssets[i].indexOf('bower_components/') === -1) {
      var index = aggregatedAssets[i].indexOf('/') + 1;
      aggregatedAssets[i] = aggregatedAssets[i].substring(0, index) + "public/" + aggregatedAssets[i].substring(index);
    }
    try {
      fs.lstatSync(__dirname + '/../packages/core/' + aggregatedAssets[i]);
      aggregatedAssets[i] = 'packages/core/' + aggregatedAssets[i];
      continue;
    } catch(e) {
      // Not a file
    }
    try {
      fs.lstatSync(__dirname + '/../packages/custom/' + aggregatedAssets[i]);
      aggregatedAssets[i] = 'packages/custom/' + aggregatedAssets[i];
    } catch (e) {
      // Not a file
    }
  }
  return aggregatedAssets;
}