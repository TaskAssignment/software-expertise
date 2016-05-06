'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');

module.exports = function (BaseFrame){
    return {
        save: function(req, res){
            console.log(req.params);
            console.log(req.query);
            var projName = req.params.name;
            var projId = req.params.id;
            Project.findOne({name: projName, _id: projId},
            function (err, result){
                if(result){
                    res.send(result);
                }else{
                    var project = new Project();
                    project.name = projName;
                    project._id = projId;

                    project.save();
                    res.send(project);
                }
            });
        }
    }
}
