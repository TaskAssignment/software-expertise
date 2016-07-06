'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This shows words that will be removed from texts accross the system. These
* are common words from the English Language.
*
* @class StopWord
* @requires mongoose
**/
var StopWordSchema = new Schema({
    _id: String
});

mongoose.model('StopWord', StopWordSchema);
