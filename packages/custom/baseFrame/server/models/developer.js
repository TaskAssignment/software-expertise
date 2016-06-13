'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/************** SUBDOCUMENTS *******************/

var QuestionSchema = new Schema({
    _id: String,
    title: String,
    body: String,
    tags: [String],
    score: Number,
    title: String,
    createdAt: Date,
    updatedAt: Date
});

var AnswerSchema = new Schema({
    _id: String,
    body: String,
    questionId: String,
    tags: [String],
    favoriteCount: Number,
    score: Number,
    createdAt: Date,
    updatedAt: Date
});

var TagSchema = new Schema({
    _id: String,
    count: Number,
    soCount: Number
});

var SoProfileSchema = new Schema({
    _id: String,
    displayName: String,
    soPopulated: {
        type: Boolean,
        default: false
    },
    tags: [TagSchema],
    questions: [QuestionSchema],
    answers: [AnswerSchema]
}, {
    timestamps: true
});

var GitHubProfileSchema = new Schema({
    _id: { //GitHub username
        type: String,
        required: true,
        unique: true
    },
    email: String,
    repositories: [{
        type: String,
        ref: 'Project',
        unique: true
    }]
}, {
    timestamps: true
});


/***************** MAIN DOCUMENT *******************/

var DeveloperSchema = new Schema({
    _id: String, //For now, this will be the GH username or the SO display_name
    ghProfile: GitHubProfileSchema,
    soProfile: SoProfileSchema
}, {
    timestamps: true
});

//To add a new profile, just create the schema and then reference it here!!!

mongoose.model('Developer', DeveloperSchema);
