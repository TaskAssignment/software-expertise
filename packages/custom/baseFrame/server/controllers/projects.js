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
        }
    }
}
