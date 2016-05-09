'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');

var request = require('request');

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
        find: function (req, res){
            console.log("******** FIND ISSUES *******");
            var repo = req.params;
            Issue.find(repo, {lean: true}, function(err, issues){
                if(!issues){
                    var issuesURL = 'https://api.github.com/repos/' +
                    repo.name + '/issues';
                    request.get(issuesURL).on('success', function (results) {
                        issues = []
                        for (var i in results) {
                            var result = results[i];
                            var issue = {
                                _id: result.id,
                                body: result.body,
                                title: result.title,
                                projectId: repo.projectId
                            }

                            issues.push(issue);
                        }
                        console.log(issues);
                        res.send(issues);
                        Issue.collection.insert(issues, function(err){
                            if(err){
                                console.log(err.message);
                            }else{
                                console.log('Issues saved successfully!');
                            }
                        });
                    });
                } else {
                    res.send(issues);
                }
            });
        }
    }
}
