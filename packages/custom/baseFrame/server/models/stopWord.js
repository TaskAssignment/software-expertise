'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StopWordSchema = new Schema({
    word: {
        type: String,
        required: true,
        unique: true
    }
});

mongoose.model('StopWord', StopWordSchema);
