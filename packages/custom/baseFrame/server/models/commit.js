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

var CommitSchema = new Schema({
    _id: String,
    message: String,
    user: String,
    projectId: {
        type: String,
        ref: 'Project',
    },
    createdAt: Date,
    updatedAt: Date,
    comments: [CommentSchema]
});

mongoose.model('Commit', CommitSchema);
