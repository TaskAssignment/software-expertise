'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        /** Looks for the given (req.params) repository in the database.
        *
        * @param req - Express request
        * @param res - Express response
        */
        find: function (req, res){
            var repo = req.params;

            Issue.find(repo, function(err, issues){
                res.send(issues);
            });
        },

        /** Stores in the database all the issues from the given repository.
        *
        * @param req - Express request
        * @param res - Express response
        */
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

            /** Callback to the request. This will create the issues and save
            * them in the database.
            *
            * @param error - Any errors ocurred during the http request
            * @param response - The response from the other server
            * @param body - The response body (string). Final html or JSON.
            */
            function callback(error, response, body){
                //Pagination!

                if (!error && response.statusCode == 200) {
                    var issues = [];
                    var results = JSON.parse(body);

                    for (var i in results) {
                        var result = results[i];
                        var issue = {
                            _id: result.id,
                            number: result.number,
                            body: result.body,
                            title: result.title,
                            projectId: repo.projectId,
                            reporterId: result.user.login
                        }

                        if(result.assignee){
                            issue['assigneeId'] = result.assignee.login;
                        }

                        issues.push(issue);
                    }
                    Issue.create(issues, function(err){
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
                nextRequest(response.headers.link);
            }

            /** This reads and parses the link header in GitHub API to get the
            * next url and avoid infinite loop (next of the last page
            * is the first one)
            *
            * @param link - Value of headers['link'] from the response
            */
            function nextRequest(link){
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
        }
    }
}
