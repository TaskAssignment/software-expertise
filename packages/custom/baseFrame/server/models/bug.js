'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: String,
    bugCount: Number,
    soCount: Number,
});


/** This represents a generic bug. A bug must have at least title and body.
* Tags are generated from title and body, based on StackOverflow tags.
* @class Bug
* @requires mongoose
**/

var BugSchema = new Schema({
    /** This will be the id of this bug. By convension, we use an acronym
    * of the source (2 letters) + the id on the source.
    *
    * @inner
    * @type {String}
    * @example A bug with Id 123 from Bugzilla will be saved here with _id = 'BZ123'
    * @memberof Bug
    **/
    _id: String,

    /** The title of the bug. Usually is a short description of the problem and
    * is required on most bug trackers. It's also required here.
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    title: String,

    /** The complete description of this bug. It's not required if the source
    * doesn't have it.
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    body: String,

    /** This represents the current status of the bug. It's usually one word that
    * will shortly describe what is happening. If the source has this data, it's
    * also useful.
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    status: String,

    /** The labels related to this bug. It's not required.
    *
    * @inner
    * @type {Array<String>}
    * @memberof Bug
    **/
    labels: [String],

    /** The creation date on the source database! (not this one). Required.
    *
    * @inner
    * @type {Date}
    * @memberof Bug
    **/
    createdAt: Date,

    /** The person who reported this bug. Not required.
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    author: String,

    /** The person who closed/solved this bug. Not required.
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    closedBy: String,

    /** The date this bug was closed on the source database. Not required.
    *
    * @inner
    * @type {Date}
    * @memberof Bug
    **/
    closedAt: Date,

    /** The url to acces this bug on the source website/repository
    *
    * @inner
    * @type {String}
    * @memberof Bug
    **/
    url: String,

    /** The last time this was modified.
    *
    * @inner
    * @type {Date}
    * @memberof Bug
    **/
    updatedAt: Date,

    /** This is used for internal purposes only. It checks tags were generated
    * from the title and description.
    *
    * @inner
    * @type {Boolean}
    * @memberof Bug
    * @default false
    **/
    parsed: Boolean,

    /** These tags are generated from tiltle and description. The text is broken
    * into words and those are compared with StackOverflow tags.
    *
    * @inner
    * @memberof Bug
    * @property {String} _id - The tag name
    * @property {Number} bugCount - How many times this tag has appeared on the text
    * @property {Number} soCount - How many times this tag has been used in the whole StackOverflow
    * @type {Array<Object>}
    **/
    tags: [TagSchema],
});

mongoose.model('Bug', BugSchema);
