'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    soTotalCount: Number
});

mongoose.model('Tag', TagSchema);
