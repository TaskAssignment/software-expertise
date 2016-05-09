'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');
var Issue = mongoose.model('Issue');

module.exports = function (BaseFrame){

    // /**
    // * display information based on issues
    // *
    // * @param issue - Dictionary with id, title and body from github issue
    // */
    // getIssueTags = function (issue) {
    //     $location.search('issueId', issue.id);
    //
    //     //Any word from the issue that is an SO tag will be in this array.
    //     //This is the array that is sent to '/api/baseFrame/coOccurrence'
    //     showLoadingScreen();
    //     $http({
    //         method: 'POST',
    //         url: '/api/baseFrame/getIssueTags',
    //         data: 'title=' + issue.title + '&body=' + issue.body,
    //         headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    //     }).success(function (response) {
    //         hideLoadingScreen();
    //         tagsFromIssue = response;
    //         sendToGraph();
    //     });
    // }

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
            console.log("FIND");
            Project.findOne(req.params, 'name', {lean: true}, function(err, project){
                res.send(project);
            });
        },
        issues: function(req, res){
            console.log("**************** ISSUES");
            console.log(req.params);
            var repo = req.params;
            // Issue.find(repo, {lean: true}, function(err, issues){
            //     // console.log(err);
            //     // if(!issues){
            //     //     var issuesURL = 'https://api.github.com/repos/' +
            //     //     repo.name +
            //     //     '/issues';
            //     //     issues = []
            //     //     $http.get(issuesURL).success(function (results) {
            //     //         for (var i in results) {
            //     //             var result = results[i];
            //     //             var issue = {
            //     //                 _id: result.id,
            //     //                 body: result.body,
            //     //                 title: result.title
            //     //             }
            //     //
            //     //             issues.push(issue);
            //     //         }
            //     //     });
            //     //     Issue.collection.insert(issues, function(err){
            //     //         if(err){
            //     //             console.log(err.message);
            //     //         }else{
            //     //             console.log('Issues saved successfully!');
            //     //         }
            //     //     });
            //     //     res.send(issues);
            //     // } else {
            //     //     res.send(issues);
            //     // }
            // });
            res.sendStatus(200);
        }
    }
}
