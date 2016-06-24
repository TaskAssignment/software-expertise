'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: String,
    issueCount: Number,
    soCount: Number
});

var IssueSchema = new Schema({
    //Using number here to sort properly. I'll think of something else.
    _id: Number,
    projectId: {
        type: Number,
        ref: 'Project',
    },
    number: Number,
    reporterId: String,
    assigneeId: {
        type: String,
        default: undefined
    },
    body: String,
    title: String,
    type: {
        type: String,
        default: 'IS' // 'IS' for issue and 'PR' for pull_request
    },
    labels: [String],
    state: String,
    parsed: Boolean,
    createdAt: Date,
    updatedAt: Date,
    url: String,
    tags: [TagSchema],
});

mongoose.model('Issue', IssueSchema);
