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
        **/
        find: function (req, res){
            var filter = {
                projectId: req.params.projectId,
                pull_request: false
            };

            var assigned = JSON.parse(req.query.assigned);
            if(assigned){
                filter.assigneeId = { $exists: assigned };
            }

            Issue.find(filter, '_id state title parsed reporterId assigneeId pull_request', {sort: '-state -updatedAt', lean: true, limit: 500}, function(err, issues){

                res.send(issues);
            });
        }
    }
}
