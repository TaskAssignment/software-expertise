'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** CoOccurrence is the count of how many times a StackOverflow tag appears with
* another tag. All fields are required.
* @class CoOccurrence
* @requires mongoose
**/
var CoOccurrenceSchema = new Schema({
    /** The tag that we want to know the relation to others.
    *
    * @inner
    * @memberof CoOccurrence
    * @type  {String}
    * @see Tag
    * @see {@link https://api.stackexchange.com/docs/related-tags | API on related tags}
    **/
    source: {
        type: String,
        ref: 'Tag',
        required: true
    },

    /** Tag that is related to the first one
    *
    * @inner
    * @memberof CoOccurrence
    * @type  {String}
    * @see Tag
    * @see {@link https://api.stackexchange.com/docs/related-tags | API on related tags}
    **/
    target: {
        type: String,
        ref: 'Tag',
        required: true
    },

    /** Number of times these tags appear together, with source being the first tag
    *
    * @inner
    * @memberof CoOccurrence
    * @type  {Number}
    **/
    occurrences: {
        type: Number,
        required: true
    }
});

CoOccurrenceSchema.index({source: 1, target: 1});

mongoose.model('CoOccurrence', CoOccurrenceSchema);
