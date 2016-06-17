'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    _id: String,
    body: String,
    user: String,
    createdAt: Date,
    updatedAt: Date
});

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
    pullRequest: {
        type: Boolean,
        default: false
    },
    labels: [String],
    state: String,
    parsed: Boolean,
    createdAt: Date,
    updatedAt: Date,
    tags: [TagSchema],
    comments: [CommentSchema]
});

mongoose.model('Issue', IssueSchema);
