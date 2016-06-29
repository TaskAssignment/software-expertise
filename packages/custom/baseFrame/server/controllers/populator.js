'use strict';

var request = require('request');
var mongoose = require('mongoose');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var models = ['Tag', 'CoOccurrence', 'Bug', 'Developer', 'Commit',
  'CommitComment', 'IssueComment', 'Language', 'Project', 'IssueEvent', 'Contributor'];

var populated = {project: {items: {}}};
for(var model of models){
    populated[model] = NOT_READY;
}

var next_token = 0;
var ACCESS_TOKENS = [
    'access_token=7mnlmGk6edBcSJnG1Qpn1w))&key=vqnCl1eW8aKqHEBXFabq7Q((',
    'access_token=pQYmG3eKP1xoNlN*m0RD5Q))&key=LrB92oMtLUnGJ5uyZvA)bw((',
    'access_token=Al(Mk7j*crIMRteMw7AnZg))&key=Ctt)0cvvDQttNSj9wmv38g((',
    'access_token=*NptX8UDdghuEVxycU3BIQ))&key=J1y9C6i6AhWLcgHAyC2iOQ((',
    'access_token=(CnKXfjNGlEWcTd7yT7s0A))&key=vRMoDd5M)SvR0OSzLWQIfw((',
    'access_token=oXBWhENXHQZJY8h8LAykUw))&key=unaHxXqTCHJ5Ve6AfnIJGg((',
]
var stopRequests = false;
var delay = 34; // 34 ms to assure that there will be no more than 30 requests per second.
var selectedProject;
var stopWords = [];
var firstTime = true;

module.exports = function (BaseFrame) {
    return {
        GitHub: function (option, id) {
            switch (option) {
                case 'Developer':
                    populateContributors(id);
                    break;
                case 'Bug':
                    var StopWord = mongoose.model('StopWord');
                    StopWord.find().lean().exec(function (err, words) {
                        stopWords = words.map(function (word){
                            return word._id;
                        });
                        populateLanguages(id);
                        var intervalLanguage = setInterval(function () {
                            if(populated.Language === READY){
                                stopLanguage();
                            }
                        }, 1000);

                        function stopLanguage(){
                            clearInterval(intervalLanguage);
                            populateIssues(id);
                        }
                    });
                    break;
                case 'IssueEvent':
                    populateEvents(id);
                    break;
                case 'IssueComment':
                    populateComments(id, 'Issue');
                    break;
                case 'Commit':
                    populateCommits(id);
                    break;
                case 'CommitComment':
                    populateComments(id, 'Commit');
                    break;
            }
        },
        StackOverflow: function (option, projectId = '') {
            switch (option) {
                case 'Developer':
                    var interval = setInterval(function () {
                        if(populated.Developer === READY){
                            stop();
                        }
                    }, 1000);

                    function stop(){
                        clearInterval(interval);
                        populateStackOverflowUserData(projectId);
                    }
                    break;
                case 'Tag':
                    populateTags('!4-J-dto(jg0aSjE(E');
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
    var patterns = ['[a-c]', '[d-h]', '[i-n]', '[o-r]', '[s-w]', '[x-z]','[^a-z]'];
    for(var pattern of patterns){
        var regex = new RegExp('^' + pattern);
        findTags(regex);
    }

    function findTags(regex){
        Tag.find({_id: regex}).lean().exec(function (err, tags){
            for(var tag of tags){
                coOccurrenceRequest(tag, regex);
            }
        });
    }

    function coOccurrenceRequest(tag, regex){
        if(!stopRequests){
            setTimeout(function () {
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

                    CoOccurrence.collection.insert(coOccurrences, function (err){
                        if(err){
                            console.log('=== Error CoOccurrence: ' + err.message);
                        }
                    });
                }

                soPopulate('CoOccurrence', url, buildModels);
            }, delay);
        }
    }
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
                synonyms: [],
                soTotalCount: result.count
            };

            if(result.has_synonyms){
                tag.synonyms = result.synonyms;
            }
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

        if(ids.length > 0 && !stopRequests){
            populateAnswers(ids, projectId, '!FcbKgR9VoP8kZFhRg5uitziPRm');
            populateQuestions(ids, projectId, '!.FjwPG4rNrCRp8_giA4)OJE9BA8N-');
            populateUserTags(ids, projectId, '!bMMRSq0xzD.9EI');
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
function populateUserTags(ids, projectId, filter = 'default', site = 'stackoverflow'){
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
                'soProfile._id': result.user_id,
                'ghProfile.repositories': projectId
            }

            var updateFields = {
                $addToSet: {
                    'soProfile.tags': tag
                },
                'soProfile.soPopulated': true
            };

            Developer.update(filter, updateFields).exec(function(err){
                if(err){
                    console.log('=== Error UserTags: ' + err.message);
                } else {
                    console.log('User ' + result.user_id + ': tags updated!');
                }
            });
        });
    }

    var buildModels = function(items){
        for(var i in items){
            var result = items[i];
            var tag = {
                _id: result.name,
                synonyms: [],
                count: result.count
            };

            if(result.has_synonyms){
                tag.synonyms = result.synonyms;
            }
            findTags(tag, result);
        }

    }

    soPopulate('Tag', url, buildModels);
}

/** Populates all the user answers from stackoverflow using the
* soPopulate function.
**/
function populateAnswers(ids, projectId, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/answers?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Developer = mongoose.model('Developer');

    var buildModels = function(items){
        for(var result of items){
            var answer = {
                _id: result.answer_id,
                questionId: result.question_id,
                body: result.body,
                title: result.title,
                score: result.score,
                tags: result.tags,
                //Time comes in seconds on Stack Exchange API
                createdAt: new Date(result.creation_date * 1000),
                updatedAt: new Date(result.last_activity_date * 1000)
            };

            var filter = {
                'soProfile._id': result.owner.user_id,
                'ghProfile.repositories': projectId,
            }

            var updateFields = {
                $addToSet: {
                    'soProfile.answers': answer
                }
            };

            Developer.update(filter, updateFields).exec(function (err){
                if(err){
                    console.log('=== Error Answers: ' + err.message);
                } else {
                    console.log(result.owner.user_id + ' answers updated!');
                }
            });
        }

    }

    soPopulate('Answer', url, buildModels);
}

/** Populates all the user questions from stackoverflow using the
* soPopulate function.
**/
function populateQuestions(ids, projectId, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/questions?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Developer = mongoose.model('Developer');

    var buildModels = function(items){
        for(var i in items){
            var result = items[i];
            var question = {
                _id: result.question_id,
                title: result.title,
                body: result.body_markdown,
                score: result.score,
                tags: result.tags,
                createdAt: new Date(result.creation_date * 1000),
                updatedAt: new Date(result.last_activity_date * 1000)
            };

            var filter = {
                'soProfile._id': result.owner.user_id,
                'ghProfile.repositories': projectId,
            }

            var updateFields = {
                $addToSet: {
                    'soProfile.questions': question
                }
            };

            Developer.update(filter, updateFields).exec(function (err){
                if(err){
                    console.log('=== Error Questions: ' + err.message);
                } else {
                    console.log(result.owner.user_id + ' questions updated!');
                }
            });
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
                console.log('=== Error Project: ' + err.message);
            } else {
                selectedProject = project;
            }
        });

    }
    gitHubPopulate('Language', url, buildModels);
}

/** Populate Issues from a specific project on GitHub.
* It creates 'tags' based on the text of the issue and on the StackOverflow tags.
*
* @param projectId - Id of a GitHub repository.
**/
function populateIssues(projectId){
    var GitHubIssue = mongoose.model('GitHubIssue');
    var filter = {
        projectId: projectId,
    }

    GitHubIssue.findOne(filter).populate('bug').sort('-bug.createdAt')
    .exec(function (err, lastCreated){
        var url = projectId + '/issues?state=all&sort=created&direction=asc';

        if(lastCreated){
            var time = lastCreated.bug.createdAt;
            time.setSeconds(time.getSeconds() + 1);
            url +='&since=' + time.toISOString();
        }

        function save(bug, model = 'Bug') {
            var MongooseModel = mongoose.model(model);
            MongooseModel.update({_id: bug._id}, bug, {upsert:true})
            .exec(function(err){
                if(err){
                    console.log('=== Error ' + model + ': ' + err.message);
                } else {
                    console.log(model + ' ID:' + bug._id + ' saved.');
                    bug = null;
                }
            });
        }

        function makeTags(bug) {
            var title = bug.title + ' ' + selectedProject.description;
            title = title.toLowerCase().split(' ');

            var body = [];
            if(bug.body){ //It may not have a body.
                body = bug.body.toLowerCase().split(' ');
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
                if(allWords.hasOwnProperty(word)){
                    allWords[word] += 1;
                } else {
                    allWords[word] = 1;
                }
            }

            for(var word of stopWords){
                // If a stop word is in my all words, I remove it.
                if(allWords.hasOwnProperty(word)){
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

                    var bugTag = {
                        _id: tag._id,
                        soCount: tag.soTotalCount,
                        bugCount: allWords[tag._id]
                    };

                    bug.tags.push(bugTag);
                }
                bug.parsed = true;
                save(bug);
            });
        }

        var buildModels = function(results){
            for(var result of results) {
                var bug = {
                    _id: 'GH' + result.id,
                    title: result.title,
                    body: result.body,
                    status: result.state,
                    labels: [],
                    createdAt: new Date(result.created_at),
                    author: result.user.login
                    url: result.html_url,
                    tags: [],
                    closedBy: result.closed_by,
                    closedAt: result.closed_at,
                    updatedAt: new Date(result.updated_at),
                    parsed: false,
                }

                var ghIssue = {
                    _id: result.id,
                    number: result.number,
                    project: projectId,
                    bug: bug._id,
                    isPR: false,
                    assignees: [],
                }

                for(var assignee of assignees){
                    var new_assignee = {
                        username: assignee.login,
                        id: assignee.id,
                    }
                    issues.assignees.push(new_assignee);
                }


                if(result.pull_request){
                    issue.isPR = true;
                }

                for(var label of result.labels){
                    bug.labels.push(label.name);
                }

                makeTags(bug);
                save(issue, 'GitHubIssue');
            }
        }

        gitHubPopulate('Bug', url, buildModels);
    });
}

function populateContributors(projectId){
    var url = projectId + '/contributors';
    var Developer = mongoose.model('Developer');

    var buildContributor = function(result){
        var filter = {
            'ghProfile._id': result.login,
        }
        var updateFields = {
            'ghProfile.email': result.email,
        };

        var findCallback = function (err) {
            if(err){
                console.log('=== Error Developer: ' + err.message);
            }
        }

        Developer.update(filter, updateFields, findCallback);
    }

    var buildModels = function(results){
        for (var result of results) {
            var updateFields = {
                'ghProfile._id': result.login,
                'ghProfile.email': result.email,
                $addToSet: {
                    'ghProfile.repositories': projectId,
                },
            };

            var options = {
                upsert: true,
                new: true,
            }

            var findCallback = function (err, dev) {
                if(err){
                    console.log('=== Error Developer: ' + err.message);
                } else {
                    var user_url = 'https://api.github.com/users/' + dev._id;
                    if(!dev.ghProfile.email){
                        gitHubPopulate('Contributor', user_url, buildContributor, true);
                    }
                }
            }

            Developer.findByIdAndUpdate(result.login, updateFields, options, findCallback);
        }
    }

    gitHubPopulate('Developer', url, buildModels);
}

function populateCommits(projectId){
    var Commit = mongoose.model('Commit');
    Commit.findOne({projectId: projectId}, 'createdAt', {sort: '-createdAt', lean:true},function (err, lastCreated){
        var url = projectId + '/commits';

        if(lastCreated){
            lastCreated.createdAt.setSeconds(lastCreated.createdAt.getSeconds() + 1);
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
                    url: result.html_url,
                    user: ' ',
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
                }else if(result.committer){
                    commit.user = result.committer.login;
                }

                commits.push(commit);
            }

            Commit.create(commits, function(err){
                if(err){
                    console.log('=== Error Commit: ' + err.message);
                } else {
                    console.log('Commits created!')
                }
            });
        }
        gitHubPopulate('Commit', url, buildModels);
    });
}

function populateEvents(projectId){
    var url = projectId + '/issues/events'
    var IssueEvent = mongoose.model('IssueEvent');

    var buildModels = function(results){
        var issueEvents = [];
        for (var result of results) {
            if(result.issue){
                var issueEvent = {
                    _id: result.id,
                    projectId: projectId,
                    issueId: result.issue.id,
                    issueNumber: result.issue.number,
                    typeOfEvent: result.event,
                    createdAt: new Date(result.created_at)
                }
                if(result.actor){
                    issueEvent.actor = result.actor.login;
                }

                if(result.commit_id){
                    issueEvent.commitId = result.commit_id;
                }

                if(result.assignee){
                    issueEvent.assigneeId = result.assignee.login;
                }

                issueEvents.push(issueEvent);
            }
        }

        IssueEvent.create(issueEvents, function(err){
            if(err){
                console.log('=== Error IssueEvent: ' + err.message);
            } else {
                console.log('Events Created');
            }
        });

    }
    gitHubPopulate('IssueEvent', url, buildModels);
}

function populateComments(projectId, type){
    var Comment = mongoose.model('Comment');
    var filter = {
        projectId: projectId,
        type: type.toLowerCase()
    };

    var buildModels = function(results){
        var comments = [];
        for (var result of results) {
            var comment = {
                _id: result.id,
                body: result.body,
                createdAt: result.created_at,
                user: result.user.login,
                projectId: projectId,
                type: type.toLowerCase()
            }

            if(type === 'Commit'){
                comment.commitSha = result.commit_id;
            } else {
                comment.issueNumber = result.issue_url.split('/').pop();
            }

            comments.push(comment);
        }

        Comment.create(comments, function(err){
            if(err){
                console.log('=== Error Comment (' + type + '): ' + err.message);
            } else {
                console.log('Add ' + type + ' comments');
            }
        });
    }

    Comment.findOne(filter, 'createdAt', {sort: '-createdAt', lean:true}, function (err, lastCreated){
        var url = projectId;
        if(type === 'Issue'){
            url += '/issues/comments?sort=updated&direction=asc'
        } else {
            url += '/comments';
        }

        if(lastCreated && type === 'Issue'){
            lastCreated.createdAt.setSeconds(lastCreated.createdAt.getSeconds() + 1);
            url += '&since=' + lastCreated.createdAt.toISOString();
        }

        gitHubPopulate(type + 'Comment', url, buildModels);
    });
}

function gitHubPopulate(option, specificUrl, callback, finalUrl = false){
    var uri = specificUrl;
    if(!finalUrl) {
        uri = 'https://api.github.com/repositories/' + specificUrl;
        uri += specificUrl.lastIndexOf('?') < 0 ? '?' : '&';
        uri += 'per_page=100';
    }

    var options = {
        headers: {
            'User-Agent': 'TaskAssignment/software-expertise',
            Accept: 'application/vnd.github.v3+json'
        },
        uri: uri,
        auth:{
            bearer: '19e383c976807df0359e36ba05938027e4a20c45'
        }
    };

    var requestCallback = function (error, response, body){
        if (!error) {
            switch (response.statusCode) {
                case 200:
                    var results = JSON.parse(body);
                    // results.etag = response.headers.etag;
                    callback(results);

                    var links = response.headers.link || '';
                    var next;
                    for(var link of links.split(',')){
                        if(link.lastIndexOf('next') > 0){
                            next = link;
                        }
                    }

                    if(next){
                        var begin = next.indexOf('<');
                        var end = next.indexOf('>');

                        //This gets string = [begin, end)
                        var new_uri = next.substring(begin + 1, end);

                        options.uri = new_uri;

                        setTimeout(function () {
                            request(options, requestCallback);
                        }, 10);
                    } else {
                        if(option === 'IssueComment' && results.length > 0){
                            var last = results.length - 1;
                            var lastUpdated = new Date(results[last].updated_at);
                            var yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            if(yesterday > lastUpdated){
                                lastUpdated.setSeconds(lastUpdated.getSeconds() + 1);
                                options.uri = uri + '&since=' + lastUpdated.toISOString();
                                request(options, requestCallback);
                            } else {
                                console.log('*** DONE ***', option);
                                populated[option] = READY;
                            }
                        } else {
                            console.log('*** DONE ***', option);
                            populated[option] = READY;
                        }
                    }
                    break;
                case 400:
                case 401:
                case 402:
                case 406:
                case 502:
                case 500:
                case 502:
                case 503:
                    console.log('Git Server Error. Trying again in one second');
                    console.log(body, response.statusCode);
                    remakeRequest(options, requestCallback);
                    break;
                case 403:
                    var gitResponse = JSON.parse(body);
                    console.log('Abuse Rate. Trying again in one second;');
                    console.log(body, response.statusCode);
                    remakeRequest(options, requestCallback);
                    break;
                default:
                    console.log(body, response.statusCode);
            }
        } else {
            console.log(body, error.message);
        }
    }

    request(options, requestCallback);
}

function soPopulate(option, specificUrl, callback) {
    var uri = 'https://api.stackexchange.com/2.2/' + specificUrl +
      '&pagesize=100&pagesize=100';
    uri += ACCESS_TOKENS[next_token];

    var options = {
        headers: {
            'Accept-Encoding': 'gzip'
        },
        gzip: true,
        uri: uri
    };

    var requestCallback = function (error, response, body){
        if (!error){
            switch (response.statusCode) {
                case 200:
                    var results = JSON.parse(body);
                    callback(results.items);

                    console.log(option + ': Page ' + results.page);
                    // Check for next page
                    if(results.has_more){
                        var new_uri = uri + ACCESS_TOKENS[next_token] + '&page=' +
                        (parseInt(results.page) + 1);
                        options.uri = new_uri;

                        //To avoid exceed rate limit
                        setTimeout(function () {
                            request(options, requestCallback);
                        }, 100);
                    } else {
                        console.log(option + ' done!');
                    }
                    break;
                case 401:
                case 402:
                case 406:
                case 502:
                    console.log('Error Related to token. Trying a different one');
                    console.log(body);
                    next_token = (next_token + 1) % ACCESS_TOKENS.length;
                    if(next_token === 0){
                        stopRequests = true;
                    } else {
                        var page = '&' + options.uri.split('&').pop();
                        options.uri = uri + ACCESS_TOKENS[next_token] + page;
                        request(options, requestCallback);
                    }
                    break;
                case 400:
                case 500:
                case 503:
                    console.log('SE Server Error. Trying again in one second');
                    console.log(body);
                    remakeRequest(options, requestCallback);
                    break;
                default:
                    console.log(body);
            }
        } else {
            console.log(error.message, body);
        }
    }

    request(options, requestCallback);
}

function remakeRequest(options, requestCallback){
    if(firstTime){
        setTimeout(function () {
            request(options, requestCallback);
            firstTime = false;
        }, 1000);
    } else {
        console.log('Stopping here to avoid abuse. Check for error details');
    }
}
