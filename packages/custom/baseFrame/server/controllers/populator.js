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
    Comment: {
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

var gitHubPopulate = function (option, specificUrl, callback){
    var uri = 'https://api.github.com/repositories/' + specificUrl
    if(specificUrl.lastIndexOf('?') < 0){
        uri += '?per_page=100'; //If there is no query it has to have the question mark
    } else {
        uri += '&per_page=100';
    }

    console.log(uri);
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

            populated[option].pagesAdded = pageCounter;
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

        if(lastCreated){
            url += '&since=' + lastUpdate.createdAt.toISOString();
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
                    createdAt: result.created_at,
                    updatedAt: result.updated_at,
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
                        _id: result.login,
                        repositories: [projectId]
                    }
                }
            }
            Developer.update(filter, updateFields, {upsert: true}).exec();
        }
    }

    gitHubPopulate('Developer', url, buildModels);
}

function populateCommits(id){
    var Commit = mongoose.model('Commit');
    Commit.findOne({projectId: id}, '-_id createdAt', {sort: '-createdAt', lean:true},function (err, lastUpdate){
        var url = id + '/commits';

        if(lastUpdate){
            url += '?since=' + lastUpdate.createdAt.toISOString();
        }

        var buildModels = function(results, projectId){
            var commits = [];

            for (var i in results) {
                var result = results[i];
                var commit = {
                    _id: result.sha,
                    message: result.commit.message,
                    comments: []
                }

                if(result.commit.author){
                    commit.createdAt = result.commit.author.date;
                } else if(result.commit.commiter){
                    commit.createdAt = result.commit.committer.date;
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
    });
}
