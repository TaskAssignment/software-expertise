'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var TagSchema = new Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    soTotalCount: {
        type: Number,
    },
}, {
    timestamps: true
});

TagSchema.plugin(mongooseToCsv, {
    headers: 'Name  SoCount',
    constraints: {
        'Name': '_id',
        'SoCount': 'soTotalCount'
    }
});

mongoose.model('Tag', TagSchema);
