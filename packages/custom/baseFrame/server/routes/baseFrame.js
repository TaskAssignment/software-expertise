'use strict';

module.exports = function (BaseFrame, app, auth, database) {
    app.route('/expertise').get(function(res, req){
        console.log(req.query);
        console.log(req);
        res.json("OK");
    });
    var controllers = '../controllers/';
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
