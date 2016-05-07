'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

module.exports = function (BaseFrame){
    return {
        save: function(req, res){
            Project.findOne(req.params,
            function (err, result){
                if(result){
                    res.send(result);
                }else{
                    var project = req.params;

                    Project.create(project, function(err, project){
                        if(err){
                            res.send(err);
                        }
                        res.send(project);
                    });
                }
            });
        },
        find: function(req, res){
            console.log("*********** TESTE NEW PLACE");
            res.sendStatus(200);
            var name = req.query.repoName;
            if(name){
                Project.findOne({name: name}, {lean: true}, function(err, project){
                    if(project._id){
                        res.render('index',{ '$scope.selectedRepo': project });
                    }
                    res.render('index');
                });
            }
        }
    }
}
