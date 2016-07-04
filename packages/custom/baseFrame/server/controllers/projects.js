'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

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
            var GitHubIssue = mongoose.model('GitHubIssue');

            var filter = {
                project: req.params.projectId,
                isPR: false,
            };
            var items = '_id bug';

            GitHubIssue.find(filter, items).sort('-createdAt').limit(500)
              .populate('bug', 'title').lean().sort('-updatedAt')
              .exec(function(err, bugs){
                res.send(bugs);
            });
        }
    }
}
