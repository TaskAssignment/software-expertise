'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the given (req.params) repository in the database.
        *
        * @param req - Express request
        * @param res - Express response
        */
        find: function (req, res){
            var repo = req.params;

            Issue.find(repo, function(err, issues){
                res.send(issues);
            });
        }
    }
}
