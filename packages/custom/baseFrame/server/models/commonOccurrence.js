'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommonOccurrenceSchema = new Schema({
    source: {
        type: String,
        ref: 'Tag',
        required: true
    },
    target: {
        type: String,
        ref: 'Tag',
        required: true
    },
    occurrences: {
        type: Number,
        required: true
    }
});

CommonOccurrenceSchema.index({source: 1, target: 1});

CommonOccurrenceSchema.path('occurrences').validate(function (occurrences){
    return !!occurrences;
}, 'Occurrences cannot be blank!');

mongoose.model('CommonOccurrence', CommonOccurrenceSchema);
