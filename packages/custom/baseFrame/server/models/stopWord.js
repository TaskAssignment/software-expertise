'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StopWordSchema = new Schema({
    _id: String
});

mongoose.model('StopWord', StopWordSchema);
