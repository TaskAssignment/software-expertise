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
    },
    email: {
        type: String,
    },
    emailHash:{
        type: String,
    },
    soId: {
        type: String,
    },
    repositories: {
        type: [String],
    },
    tags:{
        type: [{
            _id: String,
            count: String
        }]
    }
}, {
    timestamps: true
});

//Validations
SoUserSchema.path('soId').validate(function (email) {
    return !!soId;
}, 'soId cannot be blank!');

mongoose.model('SoUser', SoUserSchema);
