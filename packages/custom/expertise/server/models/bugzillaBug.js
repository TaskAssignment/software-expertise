'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This is a bug from Bugzilla. It has more information than the basic bug and
* it references a Bug. Using mongoose, the bug can be accessed if populate is
* used
*
* @class BugzillaBug
* @see Bug
* @requires mongoose
**/
var BugzillaBugSchema = new Schema({
    /** The id on the source. Since this is a Bugzilla bug, this number should be
    * unique on their database. However, since Bugzilla is an open source sofware,
    * we use the service to assure the uniqueness of this id. E.g: If this bug comes
    * from mozilla, it will have _id = 'MZ' + id.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    **/
    _id: String,

    /** The project this bug comes from in the format 'service/product'.
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    **/
    project: String,

    /** Indicates the severity of this bug
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    **/
    severity: String,

    /** This is the reference to the generic Bug on the database. (Like a Foreign
    * Key on a relational database)
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    * @see Bug
    **/
    bug: {
        type: String,
        ref: 'Bug',
    },

    /** This is references the assignee on this database
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    * @see BugzillaProfile
    **/
    assignee: {
        type: String,
        ref: 'BugzillaProfile',
    },

    /** List of users that may help on the resolution of this bug.
    *
    * @inner
    * @type {Array<String>}
    * @memberof BugzillaBug
    * @see BugzillaProfile
    **/
    ccUsers: [{
        type: String,
        ref: 'BugzillaProfile',
    }],

    /** Classification of this bug
    *
    * @inner
    * @type {String}
    * @memberof BugzillaBug
    **/
    classification: String,

    /** Component that this bug is related to/occurs at
    *
    * @inner
    * @type {String}
    * @example Firefox Accounts, New Tab Page
    * @memberof BugzillaBug
    **/
    component: String,

    /** Product version that this bug is happening on.
    *
    * @inner
    * @type {String}
    * @example 47 Branch
    * @memberof BugzillaBug
    **/
    version: String,

    /** The OS that the bug is happening on.
    *
    * @inner
    * @type {String}
    * @example x86_64 Windows, Linux
    * @memberof BugzillaBug
    **/
    platform: String,

    /** The Product that produces this bug
    *
    * @inner
    * @type {String}
    * @example Firefox for iOS, Firefox
    * @memberof BugzillaBug
    **/
    product: String,
});

mongoose.model('BugzillaBug', BugzillaBugSchema);
