'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var GitHubProfileSchema = new Schema({
    _id: { //GitHub username
        type: String,
        required: true,
        unique: true
    },
    email: String,
    repositories: [String],
    developer: {
        type: Schema.ObjectId,
        ref: 'Developer'
    }
}, {
    timestamps: true
});

GitHubProfileSchema.plugin(mongooseToCsv, {
    headers: 'Username Email Repositories',
    constraints: {
        'Username': '_id',
        'Email': 'email',
        'Repositories': 'repositories'
    }
});

mongoose.model('GitHubProfile', GitHubProfileSchema);
