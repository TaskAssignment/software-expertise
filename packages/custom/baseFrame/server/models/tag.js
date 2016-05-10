'use strict';

//dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    soTotalCount: {
        type: Number,
    },
}, {
    timestamps: true
});

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
