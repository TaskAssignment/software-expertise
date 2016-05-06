'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
    _id: {
        type: String,
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    language: { //I'll get just the main language for now.
        type: String,
    }
});

mongoose.model('Project', ProjectSchema);
