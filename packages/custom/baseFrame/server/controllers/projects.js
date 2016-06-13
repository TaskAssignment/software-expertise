'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');
var Issue = mongoose.model('Issue');
var Commit = mongoose.model('Commit');

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
            Project.find(req.query, '_id name description languages', {lean: true}, function (err, projects){
                res.send({projects: projects});
            })
        }
    }
}
