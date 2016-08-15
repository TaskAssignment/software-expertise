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
    /** The tag name
    *
    * @inner
    * @memberof Tag
    * @type {String}
    **/
    _id: {
        type: String,
        required: true,
        unique: true
    },

    /** Synonyms for this Tag
    *
    * @inner
    * @memberof Tag
    * @type {Array<String>}
    **/
    synonyms: [String],

    /** How many times this tag has been used in the whole StackOverflow
    *
    * @inner
    * @memberof Tag
    * @type {Number}
    **/
    soTotalCount: Number
});

mongoose.model('Tag', TagSchema);
