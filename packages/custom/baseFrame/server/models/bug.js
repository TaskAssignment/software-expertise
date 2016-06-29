'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: String,
    bugCount: Number,
    soCount: Number,
});

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
