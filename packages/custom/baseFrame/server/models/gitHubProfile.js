'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GitHubProfileSchema = new Schema({
    _id: { //GitHub id
        type: String, //TODO:This is temporary!
        required: true,
        unique: true,
    },
    username: String,
    email: String,
    repositories: [{
        type: Number,
        ref: 'Project',
        unique: true,
    }],
}, {
    timestamps: true
});

mongoose.model('GitHubProfile', GitHubProfileSchema);
