'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProjectSchema = new Schema({
    _id: {
        type: Number,
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    language: String,
    languages: [{
        _id: String,
        amount: String,
    }],
    eventsEtag: String, 
}, {
    timestamps: true
});

mongoose.model('Project', ProjectSchema);
