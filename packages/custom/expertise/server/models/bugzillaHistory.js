'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents the history of a bug on bugzilla
*
* @class BugzillaHistory
* @requires mongoose
**/
var BugzillaHistorySchema = new Schema({

    /** The subject of this event. CC, subscribed, severity, among others
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    what: String,

    /** The user that performed this action
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    who: String,

    /** When this action was taken
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    when: String,

    /** The new thing added to this bug, if 'what' is CC, this is an Email.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    added: String,

    /** The bug Id that this action refers to
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    bugId: {
        type: String,
        ref: 'BugzillaBug',
    },

    /** The thing that was removed from this bug, if 'what' is CC, this is an Email.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaHistory
    **/
    removed: String,
}, {
    collection: 'bugzillabugshistory',
});

mongoose.model('BugzillaHistory', BugzillaHistorySchema);
