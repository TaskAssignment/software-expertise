'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    _id: String,
    body: String,
    user: String
}, {
    timestamps: true
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
        type: String,
        ref: 'Project',
    },
    //These are both GitHub logins that are SoUser._id
    reporterId: String,
    assigneeId: {
        type: String,
        default: undefined
    },
    number: String,
    body: String,
    title: String,
    pull_request: {
        type: Boolean,
        default: false
    },
    state: String,
    parsed: Boolean,
    createdAt: Date,
    updatedAt: Date,
    tags: [TagSchema],
    comments: [CommentSchema]
});

mongoose.model('Issue', IssueSchema);
