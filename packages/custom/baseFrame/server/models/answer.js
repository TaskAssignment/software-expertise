'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnswerSchema = new Schema({
    _id: String,
    body: String,
    questionId: String,
    tags: [String]
}, {
    timestamps: true
});

mongoose.model('Answer', AnswerSchema);
