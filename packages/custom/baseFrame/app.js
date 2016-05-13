'use strict';

/*
 * Defining the Package. Needed by MEAN.
 */
var Module = require('meanio').Module;

/* Setting up our favicon */
var express = require('express');

var BaseFrame = new Module('baseFrame');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
BaseFrame.register(function(app, database,system) {
  //We enable routing. By default the Package Object is passed to the routes
  BaseFrame.routes(app, database);

  //We are adding a link to the main menu for all authenticated users
  BaseFrame.menus.add({
    title: 'Register an Administrator',
    link: 'auth.register',
    roles: ['authenticated'],
    menu: 'basemenu',
  });

   BaseFrame.menus.add({
    title: 'Upload/Download Data',
    link: 'tsv page',
    roles: ['authenticated'],
    menu: 'basemenu',
  });

  BaseFrame.angularDependencies(['mean.system']);

  return BaseFrame;
});
