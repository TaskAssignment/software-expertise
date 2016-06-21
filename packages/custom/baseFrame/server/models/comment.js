'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    _id: String,
    body: String,
    user: String,
    createdAt: Date,
    updatedAt: Date,
    issueNumber: Number,
    commitSha: String,
    projectId: Number,
    type: String //Issue comment or commit comment
});

mongoose.model('Comment', CommentSchema);
