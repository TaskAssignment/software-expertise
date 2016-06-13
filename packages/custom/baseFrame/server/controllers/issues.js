'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');
var Developer = mongoose.model('Developer');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the issues of the given repository in the database
        *
        * @param req - Express request
        * @param res - Express response
        **/
        find: function (req, res){
            var filter = {
                projectId: req.params.projectId,
                pull_request: false
            };
            var items = '_id title parsed assigneeId';
            var options = {lean: true, limit: 500};

            Issue.find(filter, items, options).sort('-updatedAt').exec(function(err, issues){
                res.send(issues);
            });
        }
    }
}
