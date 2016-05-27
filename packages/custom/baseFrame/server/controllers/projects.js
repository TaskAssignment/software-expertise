'use strict';

var mongoose = require('mongoose');
var Project  = mongoose.model('Project');
var Issue = mongoose.model('Issue');
var Commit = mongoose.model('Commit');
var SoUser = mongoose.model('SoUser');

var request = require('request');

module.exports = function (BaseFrame){
    return {

        /** Saves a project if it doens't exist in the database yet. Otherwise
        * just retrives the database that matches the params.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
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

        /** Looks for a project in the databse with the given contraints
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        find: function(req, res){
            Project.findOne(req.params, 'name description languages', {lean: true}, function(err, project){
                res.send(project);
            });
        },

        /** Stores in the database all the commits of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        populateCommits: function(req, res){
            Commit.findOne(req.params, '-_id updatedAt', {sort: '-updatedAt', lean:true},function (err, lastUpdate){
                var url = '/commits';

                if(lastUpdate){
                    url += '?since=' + lastUpdate.updatedAt.toISOString();
                }

                var buildModels = function(results, projectId){
                    var commits = [];

                    for (var i in results) {
                        var result = results[i];
                        var commit = {
                            message: result.commit.message,
                        }

                        if(result.author){
                            commit.user = result.author.login;
                        }else if(result.commiter){
                            commit.user = result.commiter.login;
                        }

                        commits.push(commit);
                    }

                    Commit.create(commits, function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                }
                gitHubRequest(url, req.params.projectId, res, buildModels);
            });
        },

        /** Stores in the database all the issues of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        populateIssues: function(req, res){
            Issue.findOne(req.params, '-_id updatedAt', {sort: '-updatedAt', lean:true},function (err, lastUpdate){
                var url = '/issues?state=all&sort=created&direction=asc'

                if(lastUpdate){
                    url += '&since=' + lastUpdate.updatedAt.toISOString();
                }

                var buildModels = function(results, projectId){
                    var issues = []
                    for (var i in results) {
                        var result = results[i];
                        var issue = {
                            _id: result.id,
                            number: result.number,
                            body: result.body,
                            title: result.title,
                            state: result.state,
                            projectId: projectId,
                            parsed: false,
                            createdAt: result.created_at,
                            updatedAt: result.updated_at,
                            reporterId: result.user.login
                        }

                        if(result.assignee){
                            issue.assigneeId = result.assignee.login;
                        }

                        if(result.pull_request){
                            issue.pull_request = true;
                        }

                        issues.push(issue);
                    }

                    Issue.create(issues, function(err){
                        if(err){
                            console.log(err);
                        } else {
                            console.log("Issues created!");
                        }
                    });

                }
                gitHubRequest(url, req.params.projectId, res, buildModels);
            });
        },

        /** Stores in the database all the contributors of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        populateContributors: function(req, res){
            var url = '/contributors';

            var buildModels = function(results, projectId){
                for (var i in results) {
                    var result = results[i];
                    var user = {
                        gitHubId: result.id,
                        $addToSet: {repositories: projectId}
                    };

                    SoUser.update({_id: result.login}, user, {upsert: true}, function(err){
                        if(err){
                            console.log(err);
                        }
                    });
                }
            }

            gitHubRequest(url, req.params.projectId, res, buildModels);
        },

        /** Stores in the database all the languages of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        populateLanguages: function(req, res){
            var url = '/languages';

            var buildModels = function(results, projectId){
                var languages = [];

                var keys = Object.keys(results);
                keys.forEach(function(key, index, array){
                    var language = {
                        _id: key.toLowerCase(),
                        amount: results[key]
                    };
                    languages.push(language);
                });

                var filter = {
                    _id: projectId,
                }

                var updateFields = {
                    $addToSet: {
                        languages: {
                            $each : languages
                        }
                    }
                }

                Project.update(filter, updateFields, {upsert: true}, function(err){
                    if(err){
                        console.log(err);
                    }
                });

            }
            gitHubRequest(url, req.params.projectId, res, buildModels);
        },

        /** Stores in the database all the issue comments of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
        populateIssuesComments: function(req, res){
            Issue.findOne(req.params, '-_id updatedAt', {sort: '-updatedAt', lean:true},function (err, lastUpdate){
                var url = '/issues/comments';

                if(lastUpdate){
                    url += '?since=' + lastUpdate.updatedAt.toISOString();
                }

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
                                console.log(err);
                            }
                        });
                    }

                }
                gitHubRequest(url, req.params.projectId, res, buildModels);
            });
        },

        /** Stores in the database all the commit comments of a given repository.
        *
        * @param req - Express request
        * @param res - Express response
        **/
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
                            console.log(err);
                        }
                    });
                }
            }

            gitHubRequest(url, req.params.projectId, res, buildModels);
        }
    }

    /** This function should be used to do any GitHub requests. It
    * represents the basic flow to the GitHub API. It retrives the
    * data and stores in the database.
    *
    * @param url - Url to be added to the baseUrl(api.github.com/repositories/:id).
        Pagination will be added as needed.
    * @param projectId - The id of the GitHub repository
    * @param res - The express response to be sent after the data is fetched.
    * @param callback - A callback to build the models. Because every model has
        different items and saving methods, this should be built in the Express
        function that calls this request.
    **/
    function gitHubRequest(specificUrl, projectId, res, callback){
        /* StackOverflow requests are compressed, if this is not set, the data
        * won't be readable.
        **/
        var url = 'https://api.github.com/repositories/' + projectId +
            specificUrl;
        if(specificUrl.lastIndexOf('?') < 0){
            url += '?per_page=100'; //If there is no query it has to have the question mark
        } else {
            url += '&per_page=100';
        }
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
        * @param link - Value of headers['link'] of the response
        **/
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
                if(nextPage != 1){
                    console.log('Next Page: ' + nextPage);
                    return new_url;
                } else {
                    console.log('********* Done! ***********');
                    return null;
                }
            }
        }
    }
}
