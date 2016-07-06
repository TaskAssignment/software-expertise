'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a user on GitHub. It shows the repositories this user is a
* contributor of.  If this user has an e-mail, it will be possible to gather
* information from multiple profiles.
*
* @class GitHubProfile
* @see Project
* @see Developer
* @requires mongoose
**/
var GitHubProfileSchema = new Schema({
    _id: { //GitHub login
        type: String,
        required: true,
        unique: true,
    },
    email: String,
    repositories: [{
        type: Number,
        ref: 'Project',
        unique: true,
    }],
}, {
    timestamps: true,
});

mongoose.model('GitHubProfile', GitHubProfileSchema);
