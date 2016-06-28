'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GitHubIssueSchema = new Schema({
    _id: Number,
    number: Number,
    bugId: {
        type: Number,
        ref: 'Bug',
    },
    projectId: {
        type: Number,
        ref: 'Project',
    },
    assignees: [{
        username: String,
        id: Number,
    }],
    isPR: { // Is this a pull request?
        type: Boolean,
        default: false,
    },
});

mongoose.model('GitHubIssue', GitHubIssueSchema);
