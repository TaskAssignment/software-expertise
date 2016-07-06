'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This is a bug from Bugzilla. It has more information than the basic bug and
* it references a Bug. Using mongoose, the bug can be accessed if populate was
* used
*
* @class BugzillaBug
* @see Bug
* @requires mongoose
**/
var BugzillaBugSchema = new Schema({
    _id: Number,
    severity: String,
    bugId: {
        type: String,
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
