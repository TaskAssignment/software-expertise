'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    soTotalCount: {
        type: Number,
    },
    soUserCount: {
        type: Number,
    },
    issueCount: {
        type: Number,
    },
    created: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

TagSchema.path('name').validate(function (name){
    return !!name;
}, 'Name cannot be blank!');

if (!TagSchema.options.toObject){
    TagSchema.options.toObject = {};
}
TagSchema.options.toObject.transform = readableTag;

if (!TagSchema.options.toJSON){
    TagSchema.options.toJSON = {};
}
TagSchema.options.toJSON.transform = readableTag;


var readableTag = function(doc, ret, options){
    var tag = {}
    tag[ret.name] = ret.soTotalCount;
    delete ret._id;
    return tag;
}

mongoose.model('Tag', TagSchema);
