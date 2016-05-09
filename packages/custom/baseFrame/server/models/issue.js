'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IssueSchema = new Schema({
    _id: { //GitHub issue id
        type: String,
        required: true,
        unique: true
    },
    projectId: {
        type: String,
        ref: 'Project',
    },
    //These are both GitHub ids, not soUser._id
    reporterId: {
        type: String,
    },
    assigneeId: {
        type: String,
    },
    body: {
        type: String
    },
    title: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

mongoose.model('Issue', IssueSchema);
