'use strict';

/** Module to handle saving and fetching projects (and thing related to them,
* like issues or contributors).
*
* @module projects
* @requires mongoose
**/

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

module.exports = function (BaseFrame){
    return {

        /** Saves a project if it doens't exist in the database yet. Otherwise
        * just retrives the project that matches the params.
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Object} req.query - Object with projectId to filter Projects.
        * @return {Object} Send the project created (or found).
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

        /** Look for a project in the databse with the given contraints
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Object} req.params - Object with projectId to filter Projects.
        * @return {Object} Send the project found.
        **/
        get: function(req, res){
            Project.findOne(req.params, 'name').lean().exec(function (err, project) {
                res.send(project);
            });
        },

        /** Look for projects in the databse with the given contraints. It is different
        * from get because it can return zero or more projects.
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Object} req.query - Constrainsts to filter Projects.
        * @return {Object} Send the all projects found with theese contraints.
        **/
        find: function (req, res) {
            Project.find(req.query, '_id name', {lean: true}, function (err, projects){
                res.send({projects: projects});
            })
        },

        /** Look for the issues of the given repository in the database
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Number} req.params.projectId - The projectId to filter issues.
        * @return {Array} Send the GitHubIssues found for this project. For performance
            issues, it restricts the results to the newest 500 issues.
        * @todo Add pagination!
        **/
        findIssues: function (req, res){
            var GitHubIssue = mongoose.model('GitHubIssue');

            var filter = {
                project: req.params.projectId,
                isPR: false,
            };
            var items = '_id bug';

            GitHubIssue.find(filter, items).populate('bug', 'title')
              .sort('-number').limit(500).lean().exec(function(err, bugs){
                res.send(bugs);
            });
        }
    }
}
