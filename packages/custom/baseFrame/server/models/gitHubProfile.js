'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var GibHubProfileSchema = new Schema({
    _id: { //GitHub username
        type: String,
        required: true,
        unique: true
    },
    gitHubId: String,
    email: [String],
    repositories: [String],
    developer: {
        type: ObjectId,
        ref: 'Developer'
    }
}, {
    timestamps: true
});

GibHubProfileSchema.plugin(mongooseToCsv, {
    headers: 'Username Email Repositories',
    constraints: {
        'Username': '_id',
        'Email': 'email',
        'Repositories': 'repositories'
    }
});

mongoose.model('GibHubProfile', GibHubProfileSchema);
