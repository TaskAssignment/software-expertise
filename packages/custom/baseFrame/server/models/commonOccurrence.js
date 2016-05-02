'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommonOccurrenceSchema = new Schema({
    source: {
        type: Schema.ObjectId,
        ref: 'Tag',
        required: true
    },
    target: {
        type: Schema.ObjectId,
        ref: 'Tag',
        required: true
    },
    occurrences: {
        type: Number,
        required: true
    }
});

CommonOccurrenceSchema.path('occurrences').validate(function (source){
    return !!occurrences;
}, 'Occurrences cannot be blank!');

mongoose.model('CommonOccurrence', CommonOccurrenceSchema);
