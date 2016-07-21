'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This class is only to show on the UI the last time a file was generated.
*
* @class GenerateFileLog
* @requires mongoose
**/
var GenerateFileLogSchema = new Schema({
    /** The model that has a file generated
    *
    * @inner
    * @memberof GenerateFileLog
    * @type {String}
    **/
    model: String,

    /** Timestamp for this model
    *
    * @inner
    * @memberof GenerateFileLog
    * @type {Date}
    **/
    timestamp: Date,
});
mongoose.model('GenerateFileLog', GenerateFileLogSchema);
