'use strict';
var d3 = require('d3');
var http = require('http');

var https = require('https');


module.exports = function (BaseFrame, app, auth, database) {
    var tags = require('../controllers/tags')(BaseFrame);

    app.post('/api/baseFrame/populateSoTags', tags.populateSoTags);
    app.post('/api/baseFrame/populateCoOccurrences', tags.populateCommonOccurrences);
    app.post('/api/baseFrame/populateSoUsers', tags.populateSoUsers);

    app.post('/api/baseFrame/getIssueTags', tags.getIssueTags);

    app.post('/api/baseFrame/soIDFromUser', tags.soIDFromUser);
    app.get('/api/baseFrame/coOccurrence', tags.coOccurrence);
};
