'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This class is only to show on the UI the last time a file was generated.
*
* @class GenerateFileLog
* @requires mongoose
**/
var GenerateFileLogSchema = new Schema({
    model: String,
    timestamp: Date,
});
mongoose.model('GenerateFileLog', GenerateFileLogSchema);
