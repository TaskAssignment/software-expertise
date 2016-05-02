'use strict';
var d3 = require('d3');
var http = require('http');

var https = require('https');


module.exports = function (BaseFrame, app, auth, database) {
    var tags = require('../controllers/tags')(BaseFrame);

    app.post('/api/baseFrame/soTags', tags.soTags);
    app.post('/api/baseFrame/soIDFromUser', tags.soIDFromUser);
    app.post('/api/baseFrame/coOccurrence', tags.coOccurrence);
};
