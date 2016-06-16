'use strict';

module.exports = function (BaseFrame, app, database) {
    //See how to nest this.
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
    app.route(base + ':projectId/users')
        .get(projects.findUsers);

    var admin = require(controllers + 'admin')(BaseFrame);
    app.route(base + 'generate')
        .get(admin.generate);
    app.route(base + 'populate')
        .get(admin.populate);
    app.route(base + 'download')
        .get(admin.download);
    app.route(base + 'check')
        .get(admin.check);
    app.route(base + 'oauth')
        .get(admin.oauth);

    /** My idea here is to be able to fetch data from different places.
    * The modes, for now, will be 'default' and 'default' to fetch data from our
    * database (populated from github/SO).
    **/
    var graph = require(controllers + 'graph')(BaseFrame);
    app.route(base + ':modeIssue/:modeUser/graphData')
        .get(graph.getDataForGraph);
    app.route(base + 'calculate/:similarity/')
        .get(graph.calculateSimilarity);
    app.route(base + 'find/:issueId/matches')
        .get(graph.findMatches);
    app.route(base + ':projectId/calculate/matches/averages')
        .get(graph.findMatchAverage);
};
