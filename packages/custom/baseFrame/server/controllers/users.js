'use strict';

var mongoose = require('mongoose');
var Developer = mongoose.model('Developer');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the given user (req.params) in the database.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        find: function (req, res){
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
    }
}
