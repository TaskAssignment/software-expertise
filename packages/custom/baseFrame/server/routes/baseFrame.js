'use strict';

module.exports = function (BaseFrame, app, auth, database) {
    var controllers = '../controllers/';

    var projects = require(controllers + 'projects')(BaseFrame);

    app.route('/expertise')
        .get(projects.find);
    app.route('/api/baseFrame/project/:_id/:language/:name')
        .get(projects.save);

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
