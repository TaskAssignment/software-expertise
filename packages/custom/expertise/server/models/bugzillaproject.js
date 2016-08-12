'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a GitHub repository.
*
* @class BugzillaProject
* @requires mongoose
**/
var BugzillaProjectSchema = new Schema({
    /** The name of the repository will be the Id. Name is given by service + project.
    * E.g.: service: mozilla, project: firefox. _id = 'mozilla/firefox'. This
    * is to make it simillar to github.
    *
    * @inner
    * @memberof BugzillaProject
    * @type {String}
    **/
    _id: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

mongoose.model('BugzillaProject', BugzillaProjectSchema);
