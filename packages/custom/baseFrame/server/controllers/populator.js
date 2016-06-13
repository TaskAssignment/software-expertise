'use strict';

var request = require('request');
var mongoose = require('mongoose');

var READY = true; //Status code to be sent when ready.
var NOT_READY = false; //Send accepted status code

var populated = {
    Tag: {
        status: NOT_READY,
        pagesAdded: 0
    },
    CoOccurrence: {
        status: NOT_READY,
        pagesAdded: 0
    },
    Issue: {
        status: NOT_READY,
        pagesAdded: 0
    },
    Developer: {
        status: NOT_READY,
        pagesAdded: 0
    },
    Commit: {
        status: NOT_READY,
        pagesAdded: 0
    },
    IssueComment: {
        status: NOT_READY,
        pagesAdded: 0
    },
    CommitComment: {
        status: NOT_READY,
        pagesAdded: 0
    },
    Language: {
        status: NOT_READY,
        pagesAdded: 0
    },
    Project: {
        status: NOT_READY,
        pagesAdded: 0
    }
}

var languages = [];
var tags = [];
var stopWords = [];

var gitHubPopulate = function (option, specificUrl, callback){
    var uri = 'https://api.github.com/repositories/' + specificUrl
    if(specificUrl.lastIndexOf('?') < 0){
        uri += '?per_page=100'; //If there is no query it has to have the question mark
    } else {
        uri += '&per_page=100';
    }

    var options = {
        headers: {
            'User-Agent': 'software-expertise',
            Accept: 'application/vnd.github.v3+json'
        },
        uri: uri,
        auth:{
            bearer: 'ab441f93f9d317b41966cc8b75d8531629036039'
        }
    };

    var pageCounter = 0;

    var requestCallback = function (error, response, body){
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            callback(results);

            var links = response.headers.link || '';
            var next = undefined;
            for(var link of links.split(',')){
                if(link.lastIndexOf('next') > 0){
                    next = link;
                }
            }

            pageCounter++;
            populated[option].pagesAdded = pageCounter;
            console.log(option + ': page ' + pageCounter + ' populated');
            if(next){
                var begin = next.indexOf('<');
                var end = next.indexOf('>');

                //This gets string = [begin, end)
                var new_uri = next.substring(begin + 1, end);

                options.uri = new_uri;

                request(options, requestCallback);
            } else {
                populated[option].status = READY;
            }
        } else {
            console.log(body, error)
        }
    }

    request(options, requestCallback);
};

var soPopulate = function (specificUrl, callback) {
    var uri = 'https://api.stackexchange.com/2.2/' + specificUrl +
      '&pagesize=100&order=desc&pagesize=100&key=unaHxXqTCHJ5Ve6AfnIJGg((';

    var options = {
        headers: {
            'Accept-Encoding': 'gzip'
        },
        gzip: true,
        uri: uri
    };

    var requestCallback = function (error, response, body){
        if (!error && response.statusCode == 200) {
            var results = JSON.parse(body);
            callback(results.items);

            //Check for next page
            if(results.has_more){
                var new_uri = uri + '&page=' +
                  (parseInt(results.page) + 1);
                options.uri = new_uri;
                request(options, requestCallback);
            }

        } else {
            console.log(body, error);
        }
    }

    request(options, requestCallback);
}

module.exports = function (BaseFrame) {
    return {
        GitHub: function (ids = []) {
            for(var id of ids){
                populateLanguages(id);
                populateIssues(id);
                populateContributors(id);
                populateCommits(id);
            }
        },
        StackOverflow: soPopulate,
        check: function (option) {
            return populated[option];
        }
    }
}

function populateLanguages(id){
    var url = id + '/languages';

    var buildModels = function(results){
        var Project = mongoose.model('Project');
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
            _id: id,
        }

        var updateFields = {
            $addToSet: {
                languages: {
                    $each : languages
                }
            }
        }

        Project.update(filter, updateFields, function(err){
            if(err){
                console.log(err);
            }
        });

    }
    gitHubPopulate('Language', url, buildModels);
}

function populateIssues(id){
    var Issue = mongoose.model('Issue');
    Issue.findOne({projectId: id}, '-_id createdAt', {sort: '-createdAt', lean:true},function (err, lastCreated){
        var url = id + '/issues?state=all&sort=created&direction=asc'

        var sinceUrl = '';
        if(lastCreated){
            sinceUrl = 'since=' + lastCreated.createdAt.toISOString();
            url += '&' + sinceUrl;
        }

        var buildModels = function(results){
            var issues = [];
            for (var i in results) {
                var result = results[i];
                var issue = {
                    _id: result.id,
                    number: result.number,
                    body: result.body,
                    title: result.title,
                    state: result.state,
                    projectId: id,
                    parsed: false,
                    pullRequest: false,
                    assigneeId: undefined,
                    createdAt: new Date(result.created_at),
                    updatedAt: new Date(result.updated_at),
                    reporterId: result.user.login
                }

                if(result.assignee){
                    issue.assigneeId = result.assignee.login;
                }

                if(result.pull_request){
                    issue.pullRequest = true;
                }

                issues.push(issue);
            }

            Issue.collection.insert(issues, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Issues created!");
                }
            });

        }
        gitHubPopulate('Issue', url, buildModels);

        var interval = setInterval(function () {
            if(populated.Issue.status === READY){
                stop();
            }
        }, 10000);

        function stop(){
            clearInterval(interval);
            populateIssuesComments(id, sinceUrl);
            // makeTags(projectId);
        }
    });
}

function populateContributors(projectId){
    var url = projectId + '/contributors';

    var buildModels = function(results){
        var Developer = mongoose.model('Developer');
        for (var i in results) {
            var result = results[i];

            var filter = {
                _id: result.login,
            }

            var updateFields = {
                $addToSet: {
                    repositories: projectId
                },
                $setOnInsert: {
                    ghProfile: {
                        _id: result.login
                    }
                }
            }
            Developer.update(filter, updateFields, {upsert: true}).exec();
        }
    }

    gitHubPopulate('Developer', url, buildModels);
}

function populateCommits(projectId){
    var Commit = mongoose.model('Commit');
    Commit.findOne({projectId: projectId}, 'createdAt', {sort: '-createdAt', lean:true},function (err, lastCreated){
        var url = projectId + '/commits';

        console.log(lastCreated);

        if(lastCreated){
            url += '?since=' + lastCreated.createdAt.toISOString();
        }

        var buildModels = function(results){
            var commits = [];

            for (var i in results) {
                var result = results[i];
                var commit = {
                    _id: result.sha,
                    message: result.commit.message,
                    projectId: projectId,
                    comments: []
                }

                if(result.commit.author){
                    commit.createdAt = new Date(result.commit.author.date);
                } else if(result.commit.commiter){
                    commit.createdAt = new Date(result.commit.committer.date);
                } else {
                    // Just to make sure there will be a date here!
                    // But this should never enter here!!!
                    commit.createdAt = new Date();
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
                } else {
                    console.log('Commits created!')
                }
            });
        }
        gitHubPopulate('Commit', url, buildModels);

        var interval = setInterval(function () {
            if(populated.Commit.status === READY){
                stop();
            }
        }, 10000);

        function stop(){
            clearInterval(interval);
            populateCommitsComments(projectId);
        }
    });
}

function populateIssuesComments(projectId, sinceUrl){
    var url = projectId + '/issues/comments?' + sinceUrl;
    var Issue = mongoose.model('Issue');


    var buildModels = function(results){
        for (var i in results) {
            var result = results[i];
            var comment = {
                _id: result.id,
                body: result.body,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
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

            Issue.update(filter, updateFields, function(err){
                if(err){
                    console.log(err);
                }
            });
        }

    }
    gitHubPopulate('IssueComment', url, buildModels);
}

function populateCommitsComments(projectId){
    var url = projectId + '/comments';

    var Commit = mongoose.model('Commit');

    var buildModels = function(results, projectId){
        for (var i in results) {
            var result = results[i];
            var comment = {
                _id: result.id,
                body: result.body,
                createdAt: result.created_at,
                updatedAt: result.updated_at,
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

            Commit.update(filter, updateFields, function(err){
                if(err){
                    console.log(err);
                }
            });
        }
    }

    gitHubPopulate('CommitComment', url, buildModels);
}
