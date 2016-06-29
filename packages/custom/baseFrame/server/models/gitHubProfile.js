'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
