'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a user on GitHub. It shows the repositories this user is a
* contributor of.  If this user has an e-mail, it will be possible to gather
* information from multiple profiles.
*
* @class GitHubProfile
* @see Developer
* @requires mongoose
**/
var GitHubProfileSchema = new Schema({
    /** The GitHub LOGIN of the user.
    *
    * @inner
    * @memberof GitHubProfile
    * @type {String}
    **/
    _id: { //GitHub login
        type: String,
        required: true,
        unique: true,
    },

    /** The public email on GitHub
    *
    * @inner
    * @memberof GitHubProfile
    * @type {String}
    **/
    email: String,

    /** The repositories that this user CONTRIBUTES to. These are updated when a
    * new project is added to the database, by getting its contributors
    *
    * @inner
    * @memberof GitHubProfile
    * @type {Array<Number>}
    * @see Project
    **/
    repositories: [{
        type: Number,
        ref: 'Project',
        unique: true,
    }],
}, {
    timestamps: true,
});

mongoose.model('GitHubProfile', GitHubProfileSchema);
