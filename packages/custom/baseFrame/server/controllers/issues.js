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
                res.send(issues);
            });
        },

        populate: function(req, res){
            var repo = req.params;

            var options = {
                headers: {
                    'User-Agent': 'software-expertise',
                    Accept: 'application/vnd.github.v3+json'
                },
                url:'https://api.github.com/repositories/' + repo.projectId +  '/issues?per_page=100'
            };
            request(options, callback);

            function callback(error, response, body){
                //Pagination!

                if (!error && response.statusCode == 200) {
                    var issues = [];
                    var results = JSON.parse(body);

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
                    Issue.collection.insert(issues, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Issues saved successfully!');
                        }
                    });
                } else {
                    console.log(error);
                    console.log(body);
                    res.sendStatus(500);
                }
                var link = response.headers.link;
                console.log(link);
                if(link){
                    //The first entry of the links array is the next page
                    var next = link.split(', ')[0];
                    //This should be always 0, but just to make sure, will get the indexOf
                    var begin = next.indexOf('<');
                    var end = next.indexOf('>');

                    //This gets string = [begin, end)
                    var new_url = next.substring(begin + 1, end);

                    var lastEqualsIndex = new_url.lastIndexOf('=');
                    var nextPage = new_url.slice(lastEqualsIndex + 1, next.length);
                    console.log(nextPage);
                    if(nextPage != 1){
                        options.url = new_url;
                        request(options, callback);
                    }
                }
            }
            res.sendStatus(200);
        }
    }
}
