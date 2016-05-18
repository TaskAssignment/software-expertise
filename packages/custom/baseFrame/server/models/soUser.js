'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var QuestionSchema = new Schema({
    _id: String,
    title: String,
    body: String,
    tags: [String],
    up_vote_count: Number,
    down_vote_count: Number,
    score: Number
},{
    timestamps: true
});

var AnswerSchema = new Schema({
    _id: String,
    body: String,
    questionId: String,
    tags: [String],
    favorite_count: Number,
    up_vote_count: Number,
    down_vote_count: Number,
    score: Number
}, {
    timestamps: true
});

var TagSchema = new Schema({
    _id: String,
    count: Number
}, {
    timestamps: true
});

var SoUserSchema = new Schema({
    _id: { //GitHub username
        type: String,
        required: true,
        unique: true
    },
    gitHubId: String,
    email: String,
    emailHash: String,
    soId: String,
    repositories: [String],
    tags: [TagSchema],
    questions: [QuestionSchema],
    answers: [AnswerSchema]
}, {
    timestamps: true
});

SoUserSchema.plugin(mongooseToCsv, {
    headers: 'Username Email SoId',
    constraints: {
        'Username': '_id',
        'Email': 'email',
        'SoId': 'soId'
    }
});

mongoose.model('SoUser', SoUserSchema);
