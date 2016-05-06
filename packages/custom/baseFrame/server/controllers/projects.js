'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

module.exports = function (BaseFrame){
    return {
        save: function(req, res){
            console.log(req.params);
            console.log(req.query);
            var project = {};
            res.json("OK");
        }
    }
}
