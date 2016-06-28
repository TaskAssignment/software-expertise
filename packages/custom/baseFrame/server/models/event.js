'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
    //Using number here to sort properly. I'll think of something else.
    _id: Number,
    projectId: {
        type: Number,
        ref: 'Project',
    },
    issueId: {
        type: Number,
        ref: 'Issue',
    },
    issueNumber: Number,
    actor: String,
    commitId: String,
    typeOfEvent: String,
    assigneeId: String,
    createdAt: Date,
    isPrEvent: {
        type: Boolean,
        default: false, //IssueEvent or Pull Request Event
    },
});

mongoose.model('Event', EventSchema);
