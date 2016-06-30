'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GenerateFileLogSchema = new Schema({
    model: String,
    timestamp: Date,
});
mongoose.model('GenerateFileLog', GenerateFileLogSchema);
