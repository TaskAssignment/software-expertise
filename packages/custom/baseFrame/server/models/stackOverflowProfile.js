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

var SoProfileSchema = new Schema({
    _id: Number,
    displayName: String,
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
    tags: [TagSchema],
    questions: [QuestionSchema],
    answers: [AnswerSchema],
}, {
    timestamps: true
});

mongoose.model('StackOverflowProfile', SoProfileSchema);
