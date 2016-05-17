'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');
var SoUser = mongoose.model('SoUser');

module.exports = function (BaseFrame){
    return {
        defaultSimilarity: function(req, res){
            
        }
    }
}
