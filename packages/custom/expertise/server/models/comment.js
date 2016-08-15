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
    /** The id on GitHub
    *
    * @inner
    * @memberof Comment
    * @type  {Number}
    **/
    _id: Number,

    /** The comment itself
    *
    * @inner
    * @memberof Comment
    * @type  {String}
    **/
    body: String,

    /** The username of the user who made this comment
    *
    * @inner
    * @memberof Comment
    * @type  {String}
    **/
    user: String,

    /** When this comment was created
    *
    * @inner
    * @memberof Comment
    * @type  {Date}
    **/
    createdAt: Date,

    /** If this comment was made on an issue, this is the number of that issue.
    * If it is on a commit this will be null.
    *
    * @inner
    * @memberof Comment
    * @type  {Number}
    **/
    issueNumber: Number,

    /** If this comment was made on a commit, this is the commit sha.
    * If it is on an issue this will be null.
    *
    * @inner
    * @memberof Comment
    * @type  {String}
    **/
    commitSha: {
        type: String,
        ref: 'Commit'
    },

    /** The id of the project where this issue occurs.
    *
    * @inner
    * @memberof Comment
    * @type  {Number}
    **/
    projectId: {
        type: Number,
        ref: 'Issue'
    },

    /** The type of comment. It can be 'issue' or 'commit'
    *
    * @inner
    * @memberof Comment
    * @type  {String}
    **/
    type: String //Issue comment or commit comment
});

mongoose.model('Comment', CommentSchema);
