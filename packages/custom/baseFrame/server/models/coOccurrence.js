'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CoOccurrenceSchema = new Schema({
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

CoOccurrenceSchema.index({source: 1, target: 1});

mongoose.model('CoOccurrence', CoOccurrenceSchema);
