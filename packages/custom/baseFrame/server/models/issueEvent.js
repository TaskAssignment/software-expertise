'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IssueEventSchema = new Schema({
    //Using number here to sort properly. I'll think of something else.
    _id: Number,
    projectId: {
        type: Number,
        ref: 'Project',
    },
    issueId: {
        type: Number,
        ref: 'Issue',
    },
    actor: String,
    commitId: String,
    typeOfEvent: String,
    assigneeId: String,
});

mongoose.model('IssueEvent', IssueEventSchema);
