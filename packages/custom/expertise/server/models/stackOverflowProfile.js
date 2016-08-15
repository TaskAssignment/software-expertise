'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
    _id: Number, //So Question id
    title: String,
    body: String,
    tags: [String],
    score: Number,
    title: String,
    createdAt: Date,
    updatedAt: Date,
});

var AnswerSchema = new Schema({
    _id: Number, //SO answer Id
    title: String, //Question title
    body: String,
    questionId: String,
    tags: [String], //Question tags
    favoriteCount: Number,
    score: Number,
    createdAt: Date,
    updatedAt: Date,
});

var TagSchema = new Schema({
    _id: String, //tag Name
    synonyms: [String],
    count: Number,
    soCount: Number,
});

/** This represents a user from StackOverflow (SO). It stores the tags, questions
* and answers related to this user on SO. If this user has an e-mail, it will
* be possible to gather information from multiple profiles and have a Developer
* profile.
*
* @class StackOverflowProfile
* @see Developer
* @requires mongoose
**/
var StackOverflowProfileSchema = new Schema({
    /** The id of this user on StackOverflow
    *
    * @inner
    * @memberof StackOverflowProfile
    * @type {Number}
    **/
    _id: Number,

    /** The display name on StackOverflow
    *
    * @inner
    * @memberof StackOverflowProfile
    * @type {String}
    **/
    displayName: String,

    /** Email on StackOverflow
    *
    * @inner
    * @memberof StackOverflowProfile
    * @type {String}
    **/
    email: String,

    /** This shows if the user data from StackOverflow was populated already.
    *
    * @inner
    * @memberof StackOverflowProfile
    * @property {Boolean} tags=false - True if tags were populated for this user
    * @property {Boolean} questions=false - True if questions were populated for this user
    * @property {Boolean} answers=false - True if answers were populated for this user
    * @property {Boolean} all=false - True if all above were populated
    * @type {Object}
    **/
    isPopulated: {
        tags: {
            type: Boolean,
            default: false,
        },
        questions: {
            type: Boolean,
            default: false,
        },
        answers: {
            type: Boolean,
            default: false,
        },
        all: {
            type: Boolean,
            default: false,
        },
    },

    /** The tags this user has activity on StackOverflow
    *
    * @inner
    * @memberof StackOverflowProfile
    * @property {String} _id - The tag name
    * @property {Array<String>} synonyms - Synonyms for this Tag
    * @property {Number} count - How many times this user has used this tag
    * @property {Number} soCount - How many times this tag has been used in the whole StackOverflow
    * @type {Array<Object>}
    **/
    tags: [TagSchema],

    /** The questions this user has asked on StackOverflow.
    *
    * @inner
    * @memberof StackOverflowProfile
    * @property {Number} _id - The question id on StackOverflow
    * @property {String} title - A short description of the question
    * @property {String} body - The longer description.
    * @property {Array<String>} tags - The tags this question has. (List of tags names)
    * @property {Number} score - The score of this question on StackOverflow
    * @property {Date} createdAt - The creation date of this question on StackOverflow
    * @property {Date} updatedAt - The updated date of this question on StackOverflow
    * @type {Array<Object>}
    **/
    questions: [QuestionSchema],

    /** The answers this user has answered on StackOverflow
    *
    * @inner
    * @memberof StackOverflowProfile
    * @property {Number} _id - The answer id on StackOverflow
    * @property {String} title - The question short description
    * @property {String} body - The answer body.
    * @property {String} questionId - The id of the question this answer answers to.
    * @property {Array<String>} tags - The question tags
    * @property {Number} favoriteCount - How many people favorited this answer.
    * @property {Number} score - The score of this answer on StackOverflow
    * @property {Date} createdAt - The creation date of this answer on StackOverflow
    * @property {Date} updatedAt - The update date of this answer on StackOverflow
    * @type {Array<Object>}
    **/
    answers: [AnswerSchema],
}, {
    timestamps: true
});

mongoose.model('StackOverflowProfile', StackOverflowProfileSchema);
