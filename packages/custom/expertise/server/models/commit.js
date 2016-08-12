'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a commit from GitHub. It shows the user and project that it
belongs to. Message is required.
*
* @class Commit
* @requires mongoose
**/
var CommitSchema = new Schema({
    /** This is the sha from the commit on GitHub. Required
    *
    * @inner
    * @memberof Commit
    * @type {String}
    **/
    _id: String,

    /** The message of the commit. Required.
    *
    * @inner
    * @memberof Commit
    * @type {String}
    **/
    message: String,

    /** The username of the user that authored this commit.
    * If that option is blank, for some reason, the commiter will be saved here.
    *
    * @inner
    * @memberof Commit
    * @type {String}
    **/
    user: String,

    /** The project where this commit comes from.
    *
    * @inner
    * @memberof Commit
    * @type {Number}
    * @see Project
    **/
    projectId: {
        type: Number,
        ref: 'Project',
    },

    /** The date that this commit was created.
    *
    * @inner
    * @memberof Commit
    * @type {Date}
    **/
    createdAt: Date,

    /** The url to see this on GitHub.
    *
    * @inner
    * @memberof Commit
    * @type {String}
    **/
    url: String
});

mongoose.model('Commit', CommitSchema);
