'use strict';

module.exports = function (BaseFrame, app, database) {
    //See how to nest this.
    var base = '/api/baseFrame/';
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(BaseFrame);
    app.route(base + 'project/find/:name')
        .get(projects.find);
    app.route(base + 'project/new/')
        .get(projects.save);
    app.route(base + ':projectId/populate/users')
        .get(projects.populateContributors);
    app.route(base + ':projectId/populate/issues')
        .get(projects.populateIssues);
    app.route(base + ':projectId/populate/commits')
        .get(projects.populateCommits);
    app.route(base + ':projectId/populate/languages')
        .get(projects.populateLanguages);
    app.route(base + ':projectId/populate/issues/comments')
        .get(projects.populateIssuesComments);
    app.route(base + ':projectId/populate/commits/comments')
        .get(projects.populateCommitsComments);


    var issues = require(controllers + 'issues')(BaseFrame);
    app.route(base + ':projectId/issues/')
        .get(issues.find);
    app.route(base + ':projectId/issue/:_id')
        .get(issues.getTags);

    var users = require(controllers + 'users')(BaseFrame);
    app.route(base + ':projectId/users')
        .get(users.find);
    app.route(base + 'user/:soId/populate/tags')
        .get(users.populateTags);
    app.route(base + 'user/:soId/populate/answers')
        .get(users.populateAnswers);
    app.route(base + 'user/:soId/populate/questions')
        .get(users.populateQuestions);

    var tags = require(controllers + 'tags')(BaseFrame);
    app.route(base + ':projectId/makeIssuesTags')
        .get(tags.makeIssuesTags);
    app.route(base + 'coOccurrence')
        .get(tags.coOccurrence);

    var admin = require(controllers + 'admin')(BaseFrame);
    app.route(base + 'populate/SoTags')
        .get(admin.populateSoTags);
    app.route(base + 'populate/CoOccurrences')
        .get(admin.populateCoOccurrences);
    app.route(base + 'populate/SoUsers')
        .get(admin.populateSoUsers);
    app.route(base + 'export/SoTags')
        .get(admin.exportSoTags);
    app.route(base + 'export/CoOccurrences')
        .get(admin.exportCoOccurrences);
    app.route(base + 'export/SoUsers')
        .get(admin.exportSoUsers);

    var stopwords = require(controllers + 'stopWords')(BaseFrame);
    app.route(base + 'populate/StopWords')
        .post(stopwords.populateStopWords);
};
