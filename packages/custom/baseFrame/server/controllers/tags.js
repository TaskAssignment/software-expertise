'use stric';

//Module dependencies (following the Articles model)
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var config = require('meanio').loadConfig();
var _ = require('lodash');

module.exports = function (Tags){
    return {

        /** Creates a new Tag
        create: function (){}
    };
}
