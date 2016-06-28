'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommitSchema = new Schema({
    _id: String,
    message: String,
    user: String,
    projectId: {
        type: Number,
        ref: 'Project',
    },
    createdAt: Date,
    url: String
});

mongoose.model('Commit', CommitSchema);
