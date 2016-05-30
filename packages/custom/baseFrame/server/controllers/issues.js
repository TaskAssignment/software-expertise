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

            var soAssigned = JSON.parse(req.query.soAssigned);
            if(soAssigned){
                var devFilter = {
                    'ghProfile.repositories': filter.projectId,
                    soProfile: {
                        $exists: true
                    }
                };

                Developer.find(devFilter, '_id', {lean: true}).sort('-updatedAt').exec(function (err, users){
                    var soUsers = [];
                    for(let user of users){
                        soUsers.push(user._id);
                    }

                    filter.assigneeId = { $in: soUsers };

                    Issue.find(filter, items, options).sort('-updatedAt').exec(function(err, issues){
                        res.send(issues);
                    });
                });
            } else {
                Issue.find(filter, items, options).sort('-updatedAt').exec(function(err, issues){
                    res.send(issues);
                });
            }
        }
    }
}
