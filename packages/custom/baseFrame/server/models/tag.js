'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    soTotalCount: {
        type: Int,
    },
    soUserCount: {
        type: Int,
    },
    issueCount: {
        type: Int,
    },
    created: {
        type: Date,
        default: Date.now
    },
});

TagSchema.path('name').validate(function (name){
    return !!name;
}, 'Name cannot be blank!');

mongoose.model('Tag', TagSchema);
