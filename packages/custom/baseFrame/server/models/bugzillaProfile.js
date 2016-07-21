'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a user on Bugzilla. If this user has an e-mail,
* it will be possible to gather information from multiple profiles.
*
* @class BugzillaProfile
* @see Developer
* @requires mongoose
**/
var BugzillaProfileSchema = new Schema({
    /** Id from Bugzilla
    *
    * @inner
    * @type {Number}
    * @memberof BugzillaProfile
    **/
    _id: {
        type: Number,
        required: true,
        unique: true,
    },

    /** Username on Bugzilla
    *
    * @inner
    * @type {String}
    * @memberof BugzillaProfile
    **/
    username: String,

    /** User's email
    *
    * @inner
    * @type {String}
    * @memberof BugzillaProfile
    **/
    email: String,

    /** The real name on Bugzilla
    *
    * @inner
    * @type {String}
    * @memberof BugzillaProfile
    **/
    realName: String,
}, {
    timestamps: true,
});

mongoose.model('BugzillaProfile', BugzillaProfileSchema);
