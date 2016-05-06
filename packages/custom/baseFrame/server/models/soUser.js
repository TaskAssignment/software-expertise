'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SoUserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    gitUsername: {
        type: String,
        required: true,
        unique: true
    },
    gitId:{ //GitHub Id
        type: String,
        unique: true
    },
    emailHash:{
        type: String,
    },
    soId: {
        type: String,
        unique: true
    }
});

//Validations
SoUserSchema.path('email').validate(function (email) {
    //Check how to validate the format. I don't know if I need to create another function here or not.
    return !!email;
}, 'Email cannot be blank!');

SoUserSchema.path('gitUsername').validate(function (email) {
    return !!gitUsername;
}, 'git Username cannot be blank!');

SoUserSchema.path('soId').validate(function (email) {
    return !!soId;
}, 'soId cannot be blank!');

mongoose.model('SoUser', SoUserSchema);
