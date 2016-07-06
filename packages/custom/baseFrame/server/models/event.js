'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** Events are the story of an Issue on GitHub. They show when that issue had
* labels added or removed, when commits referenced that issue or when a user was
* assigned or deassigned.
*
* @class Event
* @requires mongoose
**/
var EventSchema = new Schema({
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
