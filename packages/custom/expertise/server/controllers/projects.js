'use strict';

/** Module to handle saving and fetching projects (and thing related to them,
* like issues or contributors).
*
* @module projects
* @requires mongoose
**/

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

module.exports = function (Expertise){
    return {

        /** Saves a project to the database.
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Object} req.query - Object with projectId to filter Projects.
        **/
        save: function(req, res){
            Project.create(req.query, function(err, project){
                if(err && err.code !== 11000){
                    console.log(err);
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
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
            var regex = new RegExp(req.query.name, 'i');
            var filter = {};

            if(req.query.source === 'bz'){
                filter._id = regex;
                var BugzillaProject = mongoose.model('BugzillaProject');

                BugzillaProject.find(filter, '_id', {lean: true}, function (err, projects){
                    res.send(projects);
                });
            } else {
                filter.name = regex;
                Project.find(filter, '_id name', {lean: true}, function (err, projects){
                    res.send(projects);
                });
            }
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
