'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BugzillaBugSchema = new Schema({
    _id: Number,
    severity: String,
    bugId: {
        type: Number,
        ref: 'Bug',
    },
    assignee: {
        username: String,
        id: Number,
        name: String,
        email: String,
    },
    ccUsers: [{
        username: String,
        id: Number,
        name: String,
        email: String,
    }],
    classification: String,
    component: String,
    version: String,
    platform: String,
    product: String,
    summary: String,
});

mongoose.model('BugzillaBug', BugzillaBugSchema);
