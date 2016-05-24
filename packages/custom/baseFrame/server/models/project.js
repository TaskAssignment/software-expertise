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
    },
    languages: [{
        _id: String,
        amount: String
    }]
}, {
    timestamps: true
});

mongoose.model('Project', ProjectSchema);
