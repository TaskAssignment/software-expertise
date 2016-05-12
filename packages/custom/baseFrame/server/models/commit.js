'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    _id: String,
    body: String,
    user: String
}, {
    timestamps: true
});

var CommitSchema = new Schema({
    _id: String,
    message: String,
    user: String,
    projectId: {
        type: String,
        ref: 'Project',
    },
    comments: [CommentSchema]
}, {
    timestamps: true
});

mongoose.model('Commit', CommitSchema);
