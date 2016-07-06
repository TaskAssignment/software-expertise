'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents the tags from StackOverflow. Each tag may or may not have
* synonyms.
*
* @class Tag
* @requires mongoose
**/
var TagSchema = new Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    synonyms: [String],
    soTotalCount: Number
});

mongoose.model('Tag', TagSchema);
