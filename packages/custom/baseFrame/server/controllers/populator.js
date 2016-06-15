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

var stopRequests = false;
var delay = 34; // 34 ms to assure that one there will be no more than 30 requests per second.
var selectedProject = undefined;
var stopWords = [];

module.exports = function (BaseFrame) {
    return {
        GitHub: function (ids = []) {
            var StopWord = mongoose.model('StopWord');
            StopWord.find().lean().exec(function (err, words) {
                stopWords = words.map(function (word){
                    return word._id;
                });
                for(var id of ids){
                    populateLanguages(id);
                    var interval = setInterval(function () {
                        console.log('entrou');
                        if(populated.Language.status === READY){
                            stop();
                        }
                    }, 1000);

                    function stop(){
                        clearInterval(interval);
                        populateIssues(id);
                        populateContributors(id);
                        populateCommits(id);
                    }
                }
            });
        },
        StackOverflow: function (option, projectId = '') {
            switch (option) {
                case 'Developer':
                    var interval = setInterval(function () {
                        if(populated.Developer.status === READY){
                            stop();
                        }
                    }, 1000);

                    function stop(){
                        clearInterval(interval);
                        populateStackOverflowUserData(projectId);
                    }
                    break;
                case 'Tag':
                    populateTags('!*MPoAL(H5L.Myr5b');
                    break;
                case 'CoOccurrence':
                    populateCoOccurrences('!bNKX0pf0ks06(E');
                    break;
            }
        },
        check: function (option) {
            return populated[option];
        }
    }
}

function populateCoOccurrences(filter = 'default', site = 'stackoverflow'){
    var Tag = mongoose.model('Tag');
    var CoOccurrence = mongoose.model('CoOccurrence');

    Tag.find().lean().exec(function (err, tags){
        var index = 0;
        var interval = setInterval(function () {
            var tag = tags[index];
            var CONFIDENCE = 0.01;
            var MINIMUM_COUNT = CONFIDENCE * tag.soTotalCount;
            var url = 'tags/' + tag._id + '/related?order=desc&sort=popular';
            url += '&site=' + site;
            url += '&filter=' + filter;

            var buildModels = function(items){
                var coOccurrences = [];
                for(var i in items){
                    var result = items[i];
                    if(result.count >= MINIMUM_COUNT) {

                        var coOccurrence = {
                            source: tag._id,
                            target: result.name,
                            occurrences: result.count
                        };

                        coOccurrences.push(coOccurrence);
                    } else {
                        break;
                    }
                }

                CoOccurrence.collection.insert(coOccurrences);
            }

            soPopulate('CoOccurrence', url, buildModels);
            index++;
            if(stopRequests || index == tags.length){
                stop();
            }
        }, delay);

        function stop(){
            clearInterval(interval);
        }
    });
}

function populateTags(filter = 'default', site = 'stackoverflow'){
    var url = 'tags?order=desc&sort=popular';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Tag = mongoose.model('Tag');

    var buildModels = function(items){
        var tags = [];
        for(var i in items){
            var result = items[i];
            var tag = {
                _id: result.name,
                soTotalCount: result.count
            };
            tags.push(tag);
        }

        Tag.collection.insert(tags);
    }

    soPopulate('Tag', url, buildModels);
}

function populateStackOverflowUserData(projectId){
    var Developer = mongoose.model('Developer');
    var devFilter = {
        'ghProfile.repositories': projectId,
        soProfile: {
            $exists: true
        },
        'soProfile.soPopulated': false
    };

    var selectItems = 'soProfile._id';

    function partialUsers(users){
        var ids = '';
        for(var i in users){
            ids += users[i].soProfile._id + ';';
        }

        ids = ids.slice(0, -1);

        if(!stopRequests){
            populateUserTags(ids, '!bMMZz)9AYohK3E');
            populateAnswers(ids, '!FcbKgR9VoP8kZFhRg5uitziPRm');
            populateQuestions(ids, '!.FjwPG4rNrCRp8_giA4)OJE9BA8N-');
        }
    }

    Developer.find(devFilter).select(selectItems).lean().exec(function(err, devs){
        while(devs.length > 100){
            var dev_part = devs.splice(0, 100);
            partialUsers(dev_part);
        }
        partialUsers(devs);
    });
}

/** Populates all the user tags from stackoverflow using the
* soPopulate function.
*
* Filter is generated by stackexchange api. Check
*https://api.stackexchange.com/docs/tags-on-users#pagesize=100&order=desc&sort=popular&ids=696885&filter=!4-J-dtwSuoIA.NOpA&site=stackoverflow
**/
function populateUserTags(ids = '', filter = 'default', site = 'stackoverflow'){
    var url = 'users/' + ids + '/tags?order=desc&sort=popular';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Tag = mongoose.model('Tag');
    var Developer = mongoose.model('Developer');

    var findTags = function (tag, result){
        Tag.findOne({_id: tag._id}, function (err, dbTag){
            if(dbTag){
                tag.soCount = dbTag.soTotalCount;
            } else {
                //TODO: Change this to fetch the count from SO
                tag.soCount = tag.count;
            }

            var filter = {
                'soProfile._id': result.user_id
            }

            var updateFields = {
                $addToSet: {
                    'soProfile.tags': tag
                }
            };

            Developer.update(filter, updateFields).exec(function(err){
                if(err){
                    console.log(err);
                }
            });
        });
    }

    var buildModels = function(items){
        for(var i in items){
            var result = items[i];
            var tag = {
                _id: result.name,
                count: result.count
            };
            findTags(tag, result);
        }

    }

    soPopulate('Tag', url, buildModels);
}

/** Populates all the user answers from stackoverflow using the
* soPopulate function.
*
* @param req - Express request.
* @param res - Express response.
**/
function populateAnswers(ids, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/answers?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Developer = mongoose.model('Developer');

    var buildModels = function(items){
        for(var i in items){
            var result = items[i];
            var answer = {
                _id: result.answer_id,
                questionId: result.question_id,
                body: result.body,
                title: result.title,
                score: result.score,
                tags: result.tags,
                createdAt: result.creation_date * 1000,
                updatedAt: result.last_activity_date * 1000
            };
        }

        var filter = {
            'soProfile._id': result.owner.user_id
        }

        var updateFields = {
            $addToSet: {
                'soProfile.answers': answer
            },
            soPopulated: true
        };

        Developer.update(filter, updateFields).exec();
    }

    soPopulate('Answer', url, buildModels);
}

/** Populates all the user questions from stackoverflow using the
* soPopulate function.
*
* @param req - Express request.
* @param res - Express response.
**/
function populateQuestions(ids, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/questions?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Developer = mongoose.model('Developer');

    var buildModels = function(items){
        for(var i in items){
            var result = items[i];
            console.log(result);
            var question = {
                _id: result.question_id,
                title: result.title,
                body: result.body_markdown,
                score: result.score,
                tags: result.tags,
                createdAt: parseInt(result.creation_date) * 1000,
                updatedAt: parseInt(result.last_activity_date) * 1000
            };

            var filter = {
                'soProfile._id': result.owner.user_id
            }

            var updateFields = {
                $addToSet: {
                    'soProfile.questions': question
                }
            };

            console.log(question);

            Developer.update(filter, updateFields).exec();
        }
    }

    soPopulate('Question', url, buildModels);
}

function populateLanguages(id){
    var url = id + '/languages';

    var buildModels = function(results){
        var Project = mongoose.model('Project');

        var keys = Object.keys(results);
        var languages = [];
        keys.forEach(function(key, index, array){
            var language = {
                _id: key.toLowerCase(),
                amount: results[key]
            };
            languages.push(language);
        });

        var updateFields = {
            languages: languages
        }

        Project.findByIdAndUpdate(id, updateFields, {new: true}, function(err, project){
            if(err){
                console.log(err);
            } else {
                selectedProject = project;
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

        var issues = [];
        var buildModels = function(results){
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
                    tags: [],
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

                makeTags(issue);
            }

            function makeTags(issue) {
                var title = issue.title + ' ' + selectedProject.description;
                title = title.toLowerCase().split(' ');

                var body = [];
                if(issue.body){ //It may not have a body.
                    body = issue.body.toLowerCase().split(' ');
                }

                // word: count
                var allWords = {};

                for(var lang of selectedProject.languages){
                    allWords[lang._id] = 1;
                }

                for(var word of title) {
                    checkWord(word);
                }

                for(var word of body){
                    checkWord(word);
                }

                function checkWord(word){
                    if(word.indexOf('_') >= 0){
                        // Tags in SO are dash separated.
                        word = word.replace(/_/g, '-');
                    }
                    if(allWords[word] === undefined){
                        allWords[word] = 1;
                    } else {
                        allWords[word] += 1;
                    }
                }

                for(var word of stopWords){
                    // If a stop word is in my all words, I remove it.
                    if(allWords[word]){
                        delete allWords[word];
                    }
                }

                var Tag = mongoose.model('Tag');
                var filter = {
                    _id: {
                        $in: Object.keys(allWords)
                    }
                };

                Tag.find(filter).lean().exec(function(err, tags){
                    for(var i in tags){
                        var tag = tags[i];

                        var issueTag = {
                            _id: tag._id,
                            soCount: tag.soTotalCount,
                            issueCount: allWords[tag._id]
                        };

                        issue.tags.push(issueTag);
                    }
                    issue.parsed = true;
                    issues.push(issue);
                });
            }
        }

        gitHubPopulate('Issue', url, buildModels);

        var interval = setInterval(function () {
            if(populated.Issue.status === READY){
                stop();
            }
        }, 10000);

        function stop(){
            clearInterval(interval);
            console.log(issues.length);
            Issue.collection.insert(issues, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Issues created!");
                    issues = null;
                    populateIssuesComments(id, sinceUrl);
                }
            });
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
            };

            var updateFields = {
                $addToSet: {
                    repositories: projectId
                },
                $setOnInsert: {
                    ghProfile: {
                        _id: result.login
                    }
                }
            };

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

function gitHubPopulate(option, specificUrl, callback){
    var uri = 'https://api.github.com/repositories/' + specificUrl
    uri += specificUrl.lastIndexOf('?') < 0 ? '?' : '&';
    uri += 'per_page=100';

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
                setTimeout(function () {
                    populated[option].status = READY;
                }, 1000);
            }
        } else {
            console.log(body, error)
        }
    }

    request(options, requestCallback);
};

function soPopulate(option, specificUrl, callback) {
    var uri = 'https://api.stackexchange.com/2.2/' + specificUrl +
      '&pagesize=100&pagesize=100&key=unaHxXqTCHJ5Ve6AfnIJGg((';

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

            console.log(option + ': Page ' + results.page + ' populated.');
            // Check for next page
            if(results.has_more){
                var new_uri = uri + '&page=' +
                (parseInt(results.page) + 1);
                options.uri = new_uri;

                //To avoid exceed rate limit
                setTimeout(function () {
                    request(options, requestCallback);
                }, 100);
            } else {
                console.log(option + ' done!')
            }

        } else if(response.statusCode == 502){
            stopRequests = true;
        } else {
            console.log(body, error);
        }
    }

    request(options, requestCallback);
}
