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
    app.route(base + 'project/get/:name')
      .get(projects.get);
    app.route(base + 'project/find')
      .get(projects.find);
    app.route(base + 'project/new/')
      .get(projects.save);
    app.route(base + ':projectId/issues')
      .get(projects.findIssues);

    var admin = require(controllers + 'admin')(BaseFrame);
    app.route(base + 'generate')
      .get(admin.generate);
    app.route(base + 'populate')
      .get(admin.populate);
    app.route(base + 'download')
      .get(admin.download);
    app.route(base + 'check')
      .get(admin.check);
    app.route(base + 'timestamps')
      .get(admin.timestamps);
    app.route(base + 'oauth')
      .get(admin.oauth);

    var table = require(controllers + 'table')(BaseFrame);
    app.route(base + 'find/:issueId/matches')
      .get(table.findMatches);
};
