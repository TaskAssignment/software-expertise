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
            var repo = req.params;

            Issue.find(repo, 'body title', function(err, issues){
                if(issues.length == 0){
                    var options = {
                        headers: {
                            'User-Agent': 'software-expertise',
                            Accept: 'application/vnd.github.v3+json'
                        },
                        url:'https://api.github.com/repositories/' + repo.projectId +  '/issues'
                    };
                    function callback(error, response, body){
                        //Pagination!
                        // console.log(response.headers);
                        if (!error && response.statusCode == 200) {
                            issues = [];
                            var results = JSON.parse(body);

                            for (var i in results) {
                                var result = results[i];
                                var issue = {
                                    _id: result.id,
                                    body: result.body,
                                    title: result.title,
                                    projectId: repo.projectId,
                                    createdAt: Date.now()
                                }

                                issues.push(issue);
                            }
                            Issue.collection.insert(issues, function(err){
                                if(err){
                                    console.log(err.message);
                                }else{
                                    console.log('Issues saved successfully!');
                                }
                            });
                            res.send(issues);
                        } else {
                            console.log(error);
                            console.log(body);
                        }
                    }
                    request(options, callback);
                } else {
                    res.send(issues);
                }
            });
        }
    }
}
