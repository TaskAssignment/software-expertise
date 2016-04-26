'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

/* Setting up our favicon */
var express = require('express');
//var favicon = require('serve-favicon');
//var app = express();
//app.use(favicon(__dirname + '/public/assets/img/favicon.ico'));


var BaseFrame = new Module('baseFrame');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
BaseFrame.register(function(app, auth, database,system) {
  //We enable routing. By default the Package Object is passed to the routes
  BaseFrame.routes(app, auth, database);

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


  // Set views path, template engine and default layout
  app.set('views', __dirname + '/server/views');

  // BaseFrame.aggregateAsset('css', 'BaseFrame.css');
  // BaseFrame.aggregateAsset('img', 'MagnifyingGlass.png',{global:true});
  // MyPackage.aggregateAsset('js','jquery.min.js', {global:true});


  BaseFrame.angularDependencies(['mean.system']);

  //We enable routing. By default the Package Object is passed to the routes
  // BaseFrame.routes(app, auth, database);
  // // BaseFrame.angularDependencies(['ngDragDrop']);
  //
  // //We are adding a link to the main menu for all authenticated users
  // BaseFrame.menus.add({
  //   title: 'baseFrame example page',
  //   link: 'baseFrame example page',
  //   roles: ['authenticated'],
  //   menu: 'main'
  // });
  // app.set('views', __dirname + '/server/views');
  // BaseFrame.aggregateAsset('css', 'baseFrame.css');
  // BaseFrame.angularDependencies(['mean.system','ngRoute']);

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    BaseFrame.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    BaseFrame.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    BaseFrame.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return BaseFrame;
});
