'use strict';

module.exports = function (BaseFrame, app, auth, database) {
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(BaseFrame);
    // app.route('/expertise')
    //     .get(projects.find);
    app.route('/api/baseFrame/project/find/:name')
        .get(projects.find);
    app.route('/api/baseFrame/project/new/')
        .get(projects.save);

    //TODO: Refactor this to use resource. Issues and users do exactly the same thing!!!
    var issues = require(controllers + 'issues')(BaseFrame);
    app.route('/api/baseFrame/:projectId/issues/')
        .get(issues.find);
    app.route('/api/baseFrame/:projectId/issues/populate')
        .get(issues.populate);

    var users = require(controllers + 'users')(BaseFrame);
    app.route('/api/baseFrame/:projectId/users')
        .get(users.find);
    app.route('/api/baseFrame/:projectId/users/populate')
        .get(users.populate);

    var tags = require(controllers + 'tags')(BaseFrame);
    app.route('/api/baseFrame/populateSoTags')
        .post(tags.populateSoTags);
    app.route('/api/baseFrame/populateCoOccurrences')
        .post(tags.populateCommonOccurrences);
    app.route('/api/baseFrame/populateSoUsers')
        .post(tags.populateSoUsers);
    app.route('/api/baseFrame/getIssueTags')
        .post(tags.getIssueTags);
    app.route('/api/baseFrame/soIDFromUser')
        .post(tags.soIDFromUser);
    app.route('/api/baseFrame/coOccurrence')
        .post(tags.coOccurrence);

    var stopwords = require(controllers + 'stopWords')(BaseFrame);

    app.route('/api/baseFrame/populateStopWords')
        .post(stopwords.populateStopWords);



};
