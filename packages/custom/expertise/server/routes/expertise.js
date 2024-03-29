'use strict';

/** Generate the routes for the system.
*
* @module routes
**/
module.exports = function (Expertise, app, database) {
    //TODO: See how to nest this.
    var base = '/api/expertise/';
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(Expertise);
    app.route(base + 'project/get/:name').get(projects.get);
    app.route(base + 'project/find').get(projects.find);
    app.route(base + 'project/new/').get(projects.save);
    app.route(base + ':projectId/bugs').get(projects.findBugs);

    var importer = require(controllers + 'import')(Expertise);
    app.route(base + 'populate/:source/:option').get(importer.populate);
    app.route(base + 'bugzilla/:command').get(importer.bugzillaServices);
    app.route(base + 'bugzilla/:service/:project').get(importer.bugzillaServices);
    app.route(base + 'populate/check').get(importer.check);

    var exporter = require(controllers + 'export')(Expertise);
    app.route(base + 'generate').get(exporter.generate);
    app.route(base + 'download').get(exporter.download);
    app.route(base + 'check').get(exporter.check);
    app.route(base + 'timestamps').get(exporter.timestamps);

    var table = require(controllers + 'table')(Expertise);
    app.route(base + 'find/:source/:issueId/matches').get(table.findMatches);
};
