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

var IssueSchema = new Schema({
    //Using number here to sort properly. I'll think of something else.
    _id: Number,
    projectId: {
        type: String,
        ref: 'Project',
    },
    //These are both GitHub logins that are SoUser._id
    reporterId: String,
    assigneeId: String,
    number: String,
    body: String,
    title: String,
    pull_request: Boolean,
    state: String,
    comments: [CommentSchema]
}, {
    timestamps: true
});

mongoose.model('Issue', IssueSchema);
