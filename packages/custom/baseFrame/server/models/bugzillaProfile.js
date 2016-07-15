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
    _id: { //Bugzilla login
        type: Number,
        required: true,
        unique: true,
    },
    email: String,
}, {
    timestamps: true,
});

mongoose.model('BugzillaProfile', BugzillaProfileSchema);
