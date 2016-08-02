'use strict';

/** Generate the routes for the system.
*
* @module routes
**/
module.exports = function (BaseFrame, app, database) {
    //TODO: See how to nest this.
    var base = '/api/baseFrame/';
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(BaseFrame);
    app.route(base + 'project/get/:name').get(projects.get);
    app.route(base + 'project/find').get(projects.find);
    app.route(base + 'project/new/').get(projects.save);
    app.route(base + ':projectId/issues').get(projects.findIssues);

    var importer = require(controllers + 'import')(BaseFrame);
    app.route(base + 'populate/:source/:option').get(importer.populate);

    var exporter = require(controllers + 'export')(BaseFrame);
    app.route(base + 'generate').get(exporter.generate);
    app.route(base + 'download').get(exporter.download);
    app.route(base + 'check').get(exporter.check);
    app.route(base + 'timestamps').get(exporter.timestamps);

    var table = require(controllers + 'table')(BaseFrame);
    app.route(base + 'find/:issueId/matches').get(table.findMatches);

    var PythonShell = require('python-shell');
    var extractorRoute = "packages/custom/baseFrame/server/bugzilla-python/generalextractor.py"

    app.get(base+"run/:command", function(req,res){
      var pyshell = new PythonShell(extractorRoute)
      pyshell.send(req.params.command);

      pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        res.send(message);
      });

      pyshell.end(function (err) {
        if (err) throw err;
        console.log('\n done');
      });
    });

    app.get(base+"run/:service/:project", function(req,res){
      var pyshell = new PythonShell(extractorRoute);

      // sends a message to the Python script via stdin
      pyshell.send(req.params.service);
      pyshell.send(req.params.project);

      pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
      });

      // end the input stream and allow the process to exit
      pyshell.end(function (err) {
        if (err) throw err;
        console.log('\n');
        res.send("done")
      });
    });
};
