'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DeveloperSchema = new Schema({
    email: String,
    profiles: {
        gh: {
            type: Number,
            ref: 'GitHubProfile',
        },
        so: {
            type: Number,
            ref: 'StackOverflowProfile',
        },
        //To add a new profile: create the schema and then reference it here.
    },
}, {
    timestamps: true,
});

mongoose.model('Developer', DeveloperSchema);
