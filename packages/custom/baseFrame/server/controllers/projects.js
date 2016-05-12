'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');
var Issue = mongoose.model('Issue');
var Commit = mongoose.model('Commit');

var request = require('request');

module.exports = function (BaseFrame){
    return {
        save: function(req, res){
            Project.findOne(req.query,
            function (err, result){
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
        find: function(req, res){
            Project.findOne(req.params, 'name', {lean: true}, function(err, project){
                res.send(project);
            });
        },

        /** Stores in the database all the issues from the given repository.
        *
        * @param req - Express request
        * @param res - Express response
        */
        populateCommits: function(req, res){
            var url = '/commits';

            var buildModels = function(results, projectId){
                var commits = [];

                for (var i in results) {
                    var result = results[i];
                    var commit = {
                        message: result.commit.message,
                    }

                    if(result.author)
                        commit.user = result.author.login
                    else if(result.commiter)
                        commit.user = result.commiter.login
                    var filter = {
                        projectId: projectId,
                        _id: result.sha
                    }

                    Commit.update(filter, commit, {upsert: true}, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Commit updated/created successfully!');
                        }
                    });
                }


            }
            gitHubRequest(url, req.params.projectId, res, buildModels);
        },

        /** Stores in the database all the issues from the given repository.
        *
        * @param req - Express request
        * @param res - Express response
        */
        populateIssuesComments: function(req, res){
            var url = '/issues/comments';

            var buildModels = function(results, projectId){
                var comments = [];

                for (var i in results) {
                    var result = results[i];
                    var comment = {
                        _id: result.id,
                        body: result.body,
                        user: result.user.login
                    }

                    var updateFields = {
                        $addToSet: {
                            comments: comment
                        }
                    };

                    var filter = {
                        projectId: projectId,
                        number: result.issue_url.split('/').pop()
                    }

                    Issue.update(filter, updateFields, {upsert: true}, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Commit updated successfully!');
                        }
                    });
                }

            }
            gitHubRequest(url, req.params.projectId, res, buildModels);
        },

        /** Stores in the database all the issues from the given repository.
        *
        * @param req - Express request
        * @param res - Express response
        */
        populateCommitsComments: function(req, res){
            var url = '/comments';

            var buildModels = function(results, projectId){

                for (var i in results) {
                    var result = results[i];
                    var comment = {
                        _id: result.id,
                        body: result.body,
                        user: result.user.login
                    }

                    var updateFields = {
                        $addToSet: {
                            comments: comment
                        }
                    };

                    var filter = {
                        projectId: projectId,
                        _id: result.commit_id
                    }

                    Commit.update(filter, updateFields, {upsert: true}, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Commit updated successfully!');
                        }
                    });
                }



            }
            gitHubRequest(url, req.params.projectId, res, buildModels);
        }
    }

    /** This function should be used to do any StackOverflow requests. It
    * represents the basic flow to the StackExchange API. It retrives the
    * data and stores in the database. It checks for pagination following the
    * StackExchange pattern.
    *
    * @param url - The url that will receive the request. It's important that
        there is no page specified in. The pagination will be added as needed.
    * @param ids - An object with soId and userId to use in the model building.
    * @param res - The express response to be sent after the data is fetched.
    * @param callback - A callback to build the models. Because every model has
        different items and saving methods, this should be built in the Express
        function that calls this request.
    */
    function gitHubRequest(specificUrl, projectId, res, callback){
        /* StackOverflow requests are compressed, if this is not set, the data
        * won't be readable.
        */
        var url = 'https://api.github.com/repositories/' + projectId +
            specificUrl + '?per_page=100';
        var options = {
            headers: {
                'User-Agent': 'software-expertise',
                Accept: 'application/vnd.github.v3+json'
            },
            url: url,
            auth:{
                bearer: 'ab441f93f9d317b41966cc8b75d8531629036039'
            }
        };

        var requestCallback = function (error, response, body){
            if (!error && response.statusCode == 200) {
                if(!res.headersSent){
                    res.sendStatus(200);
                }
                var results = JSON.parse(body);

                callback(results, projectId);

                options.url = nextPageUrl(response.headers.link);
                request(options, requestCallback);

            } else {
                console.log(body);
                if(!res.headersSent){
                    res.status(500).send(body);
                }
            }
        }

        request(options, requestCallback);

        /** This reads and parses the link header in GitHub API to get the
        * next url and avoid infinite loop (next of the last page
        * is the first one)
        *
        * @param link - Value of headers['link'] from the response
        */
        function nextPageUrl(link){
            if(link){
                //The first entry of the links array is the next page
                var next = link.split(', ')[0];
                //This should be always 0, but just to make sure, will get the indexOf
                var begin = next.indexOf('<');
                var end = next.indexOf('>');

                //This gets string = [begin, end)
                var new_url = next.substring(begin + 1, end);

                var nextPage = new_url.split('=').pop();
                console.log(nextPage);
                if(nextPage != 1){
                    return new_url;
                } else {
                    return null;
                }
            }
        }
    }
}
