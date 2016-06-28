'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GitHubProfileSchema = new Schema({
    _id: { //GitHub username
        type: Number,
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
