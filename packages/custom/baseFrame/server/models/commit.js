'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a commit from GitHub. It shows the user and project that it
belongs to. Message is required.
*
* @class Commit
* @requires mongoose
**/
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
