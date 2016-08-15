'use strict';

/*
 * Defining the Package. Needed by MEAN.
 **/
var Module = require('meanio').Module;

/* Setting up our favicon **/
var express = require('express');
var favicon = require('serve-favicon');

var Expertise = new Module('expertise');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 **/
Expertise.register(function(app, database,system) {
  //We enable routing. By default the Package Object is passed to the routes
  Expertise.routes(app, database);

  Expertise.aggregateAsset('css', 'theme.css');

  Expertise.angularDependencies(['mean.system', 'ui.bootstrap']);
  app.use(favicon(__dirname + '/public/assets/img/favicon.ico'));


  return Expertise;
});
