'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseToCsv = require('mongoose-to-csv');

var QuestionSchema = new Schema({
    _id: String,
    title: String,
    body: String,
    tags: [String],
    score: Number
}, {
    timestamps: true
});

var AnswerSchema = new Schema({
    _id: String,
    body: String,
    questionId: String,
    tags: [String],
    favorite_count: Number,
    score: Number
}, {
    timestamps: true
});

var TagSchema = new Schema({
    _id: String,
    count: Number
});

var SoProfileSchema = new Schema({
    _id: { //soId username
        type: String,
        required: true,
        unique: true
    },
    display_name: String,
    emailHash: String,
    tags: [TagSchema],
    questions: [QuestionSchema],
    answers: [AnswerSchema],
    developer: {
        type: ObjectId,
        ref: 'Developer'
    }
}, {
    timestamps: true
});

SoProfileSchema.plugin(mongooseToCsv, {
    headers: 'Username Email SoId',
    constraints: {
        'Username': 'display_name',
        'SoId': '_id'
    }
});

mongoose.model('SoProfile', SoProfileSchema);
