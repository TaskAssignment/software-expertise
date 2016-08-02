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
    app.route(base + 'bugzilla/:command').get(importer.bugzillaServices);
    app.route(base + 'bugzilla/:service/:project').get(importer.bugzillaServices);

    var exporter = require(controllers + 'export')(BaseFrame);
    app.route(base + 'generate').get(exporter.generate);
    app.route(base + 'download').get(exporter.download);
    app.route(base + 'check').get(exporter.check);
    app.route(base + 'timestamps').get(exporter.timestamps);

    var table = require(controllers + 'table')(BaseFrame);
    app.route(base + 'find/:issueId/matches').get(table.findMatches);
};
