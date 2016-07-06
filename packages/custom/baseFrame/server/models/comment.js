'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/** This is a GitHub comment. It can reference to an Issue or to a commit. Body
* is required.
*
* @class Comment
* @see GitHubIssue
* @see Commit
* @requires mongoose
**/
var CommentSchema = new Schema({
    _id: Number,
    body: String,
    user: String,
    createdAt: Date,
    issueNumber: Number,
    commitSha: {
        type: String,
        ref: 'Commit'
    },
    projectId: {
        type: Number,
        ref: 'Issue'
    },
    type: String //Issue comment or commit comment
});

mongoose.model('Comment', CommentSchema);
