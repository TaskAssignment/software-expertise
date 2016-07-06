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
    _id: Number,
    number: Number,
    bug: {
        type: String,
        ref: 'Bug',
    },
    project: {
        type: Number,
        ref: 'Project',
    },
    assignees: [{
        username: {
            type: String,
            ref: 'GitHubProfile',
        },
    }],
    isPR: { // Is this a pull request?
        type: Boolean,
        default: false,
    },
});

mongoose.model('GitHubIssue', GitHubIssueSchema);
