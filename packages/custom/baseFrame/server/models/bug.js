'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: String,
    bugCount: Number,
    soCount: Number,
});


/** This represents a generic bug. A bug must have at least title and body.
* Tags are generated from title and body, based on StackOverflow tags.
* @class Bug
* @requires mongoose
**/
var BugSchema = new Schema({
    _id: String,
    title: String,
    body: String,
    status: String,
    labels: [String],
    createdAt: Date,
    author: String,
    closedBy: String,
    closedAt: Date,
    url: String,
    updatedAt: Date,

    parsed: Boolean,
    tags: [TagSchema],
});

mongoose.model('Bug', BugSchema);
