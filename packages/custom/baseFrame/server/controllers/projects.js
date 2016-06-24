'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

var request = require('request');

module.exports = function (BaseFrame){
    return {

        /** Saves a project if it doens't exist in the database yet. Otherwise
        * just retrives the database that matches the params.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        save: function(req, res){
            Project.findOne(req.query, function (err, result){
                if(result){
                    res.send(result);
                }else{
                    var project = req.query;

                    Project.create(project, function(err, project){
                        if(err){
                            res.send(err);
                        }
                        res.send(project);
                    });
                }
            });
        },

        /** Looks for a project in the databse with the given contraints
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        get: function(req, res){
            Project.findOne(req.params, 'name description languages', {lean: true}, function(err, project){
                res.send(project);
            });
        },

        find: function (req, res) {
            Project.find(req.query, '_id name', {lean: true}, function (err, projects){
                res.send({projects: projects});
            })
        },

        /** Looks for the given user (req.params) in the database.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        findUsers: function (req, res){
            var Developer = mongoose.model('Developer');
            var filter = {
                'ghProfile.repositories': req.params.projectId
            };

            var soAssigned = JSON.parse(req.query.soAssigned);
            if(soAssigned){
                filter.soProfile = { $exists: true };
            }

            Developer.find(filter).sort('-updatedAt').exec(function (err, users){
                res.send(users);
            });
        },

        /** Looks for the issues of the given repository in the database
        *
        * @param req - Express request
        * @param res - Express response
        **/
        findIssues: function (req, res){
            var Developer = mongoose.model('Developer');
            var Issue = mongoose.model('Issue');

            var filter = {
                projectId: req.params.projectId,
                type: 'IS',
            };
            var items = '_id title assigneeId';
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
                    var soUsers = users.map(function (user) {
                        return user._id;
                    });

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
