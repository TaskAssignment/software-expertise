'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This is the generic Developer profile. It gathers all the other profiles based
* on the user's email. One developer can have several profiles on different platforms,
* like GitHub and StackOverflow. Any other profiles must be added to this and referenced
* on their models.
*
* @class Developer
* @requires mongoose
**/
var DeveloperSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    profiles: {
        gh: [{
            type: String,
            ref: 'GitHubProfile',
        }],
        so: [{
            type: Number,
            ref: 'StackOverflowProfile',
        }],
        bz: [{
            type: Number,
            ref: 'BugzillaProfile',
        }],
        //To add a new profile: create the schema and then reference it here.
    },
}, {
    timestamps: true,
});

mongoose.model('Developer', DeveloperSchema);
