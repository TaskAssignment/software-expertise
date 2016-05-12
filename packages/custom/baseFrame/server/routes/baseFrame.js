'use strict';

module.exports = function (BaseFrame, app, auth, database) {
    //See how to nest this.
    var base = '/api/baseFrame/';
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(BaseFrame);
    app.route(base + 'project/find/:name')
        .get(projects.find);
    app.route(base + 'project/new/')
        .get(projects.save);
    app.route(base + ':projectId/populate/commits')
        .get(projects.populateCommits);
    app.route(base + ':projectId/populate/issues/comments')
        .get(projects.populateIssuesComments);
    app.route(base + ':projectId/populate/commits/comments')
        .get(projects.populateCommitsComments);


    //TODO: Refactor this to use a 'general class'. Issues and users do exactly the same thing!!!
    var issues = require(controllers + 'issues')(BaseFrame);
    app.route(base + ':projectId/issues/')
        .get(issues.find);
    app.route(base + ':projectId/issues/populate')
        .get(issues.populate);

    var users = require(controllers + 'users')(BaseFrame);
    app.route(base + ':projectId/users')
        .get(users.find);
    app.route(base + ':projectId/users/populate')
        .get(users.populate);
    app.route(base + 'user/:soId/tags/populate')
        .get(users.populateUserTags);
    app.route(base + 'user/:soId/answers/populate')
        .get(users.populateUserAnswers);
    app.route(base + 'user/:soId/questions/populate')
        .get(users.populateUserQuestions);

    var tags = require(controllers + 'tags')(BaseFrame);
    app.route(base + 'populateSoTags')
        .post(tags.populateSoTags);
    app.route(base + 'populateCoOccurrences')
        .post(tags.populateCommonOccurrences);
    app.route(base + 'populateSoUsers')
        .post(tags.populateSoUsers);
    app.route(base + 'getIssueTags')
        .post(tags.getIssueTags);
    app.route(base + 'coOccurrence')
        .post(tags.coOccurrence);

    var stopwords = require(controllers + 'stopWords')(BaseFrame);

    app.route(base + 'populateStopWords')
        .post(stopwords.populateStopWords);



};
