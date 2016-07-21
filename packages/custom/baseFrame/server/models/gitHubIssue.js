'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


/** This represents a GitHub Issue. It references to a basic bug and has the additional
* information pertinent to GitHub (like if it's a Pull Request or the Assignees)
*
* @class GitHubIssue
* @see Bug
* @requires mongoose
*/
var GitHubIssueSchema = new Schema({
    /** GitHub id for the issue.
    *
    * @inner
    * @memberof GitHubIssue
    * @type {Number}
    **/
    _id: Number,

    /** The issue number. This number is unique inside a project, but NOT in
    * all GitHub.
    *
    * @inner
    * @memberof GitHubIssue
    * @type {Number}
    **/
    number: Number,

    /** This is the reference to the generic Bug on the database. (Like a Foreign
    * Key on a relational database)
    *
    * @inner
    * @memberof GitHubIssue
    * @type {String}
    * @see Bug
    **/
    bug: {
        type: String,
        ref: 'Bug',
    },

    /** The project where this issue comes from.
    *
    * @inner
    * @memberof GitHubIssue
    * @type {Number}
    * @see Project
    **/
    project: {
        type: Number,
        ref: 'Project',
    },

    /** The assignees of this issue (zero or more)
    *
    * @inner
    * @memberof GitHubIssue
    * @type {Array<String>}
    * @see GitHubProfile
    **/
    assignees: [{
        username: {
            type: String,
            ref: 'GitHubProfile',
        },
    }],

    /** Boolean representing if this issue is a Pull Request (PR) or not. Every PR
    * is an issue on GitHub.
    *
    * @inner
    * @memberof GitHubIssue
    * @type {Boolean}
    * @default false
    **/
    isPR: { // Is this a pull request?
        type: Boolean,
        default: false,
    },
});

mongoose.model('GitHubIssue', GitHubIssueSchema);
