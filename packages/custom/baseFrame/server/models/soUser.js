'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SoUserSchema = new Schema({
    _id: { //GitHub username
        type: String,
        required: true,
        unique: true
    },
    gitHubId:{
        type: String,
        unique: true
    },
    email: {
        type: String,
    },
    emailHash:{
        type: String,
    },
    soId: {
        type: String,
        unique: true
    },
    repositories: {
        type: [String],
    },
    tags:{
        type:[
            name: String,
            count: String
        ]
    }
}, {
    timestamps: true
});

//Validations
SoUserSchema.path('soId').validate(function (email) {
    return !!soId;
}, 'soId cannot be blank!');

mongoose.model('SoUser', SoUserSchema);
