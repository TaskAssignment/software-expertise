'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents the history of a bug on bugzilla
*
* @class BugzillaComment
* @requires mongoose
**/
var BugzillaCommentSchema = new Schema({
    /** The number of the comment on bugzilla. This field has an acronym of the
    * service in front of it to assure its uniqueness. E.g: If this comment comes
    * from Mozilla, it will have _id = 'MZ' + the comment number.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaComment
    **/
    _id: String,

    /** The service that this comment comes from. Mozilla, Eclipse, Kernel.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaComment
    **/
    service: String,

    /** The comment itself.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaComment
    **/
    comment: String,

    /** When this comment was made.
    *
    * @inner
    * @type {Date}
    * @memberof BugzillaComment
    **/
    date: String,

    /** The bug Id that this comment refers to.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaComment
    **/
    bug: {
        type: String,
        ref: 'BugzillaBug',
    },
});

mongoose.model('BugzillaComment', BugzillaCommentSchema);
