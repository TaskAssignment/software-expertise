'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/** This represents a GitHub repository.
*
* @class Project
* @requires mongoose
**/
var ProjectSchema = new Schema({
    /** The id of the project on GitHub
    *
    * @inner
    * @memberof Project
    * @type {Number}
    **/
    _id: {
        type: Number,
    },

    /** The full name of the repository as given by the GitHub API.
    *
    * @inner
    * @memberof Project
    * @type {String}
    **/
    name: {
        type: String,
        required: true
    },

    /** The repository description from GitHub
    *
    * @inner
    * @memberof Project
    * @type {String}
    **/
    description: String,

    /** The main language of this project
    *
    * @inner
    * @memberof Project
    * @type {String}
    **/
    language: String,

    /** The languages and amount (in bytes) of this project.
    *
    * @inner
    * @memberof Project
    * @property {String} _id - Language name
    * @property {Number} amount - Amount (in bytes) of this language on the repo.
    * @type {Array<Object>}
    **/
    languages: [{
        _id: String,
        amount: String,
    }],

    /** The e-tag that comes from fetching Events. To populate events we need to
    * perform a lot of requests to the GitHub API. This e-tag is to prevent fetching
    * Events that were already saved to the database.
    *
    * @inner
    * @memberof Project
    * @type {String}
    * @see {@link https://developer.github.com/v3/#conditional-requests | Conditional Requests}
    **/
    eventsEtag: String,
}, {
    timestamps: true
});

mongoose.model('Project', ProjectSchema);
