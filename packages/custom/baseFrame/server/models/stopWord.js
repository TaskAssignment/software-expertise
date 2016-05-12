'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StopWordSchema = new Schema({
    _id: {
        type: String,
    }
}, {
    timestamps: true
});

mongoose.model('StopWord', StopWordSchema);
