'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the issues of the given repository in the database
        *
        * @param req - Express request
        * @param res - Express response
        */
        find: function (req, res){
            Issue.find(req.params, '_id state title parsed reporterId assigneeId pull_request', {sort: '-state pull_request', lean: true, limit: 500}, function(err, issues){

                res.send(issues);
            });
        }
    }
}
