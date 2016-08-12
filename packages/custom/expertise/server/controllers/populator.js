'use strict';
/** Module to populate data from StackExchange and GitHub.
*
* @module populator
* @requires mongoose
* @requires request
**/

var request = require('request');
var mongoose = require('mongoose');

var READY = 200; //Status code to be sent when ready.
var NOT_READY = 202; //Send accepted status code

var models = ['Tag', 'CoOccurrence', 'Bug', 'Developer', 'Commit', 'Issue',
  'CommitComment', 'IssueComment', 'Language', 'Project', 'Event', 'Contributor'];

var populated = {};
for(var model of models){
    populated[model] = NOT_READY;
}

var SO_APPS = {
    '7211': {
        client_secret: 'yurW77OF7QW5a*M84WnxJw((',
        access_token: 'yBmIU6ZDieXJH28yD8xsvg))',
        key: 'unaHxXqTCHJ5Ve6AfnIJGg((',
    },
    '7341': {
        client_secret: 'aiU5CjKOd*6Nyvjjf38ALA((',
        access_token: 'cX38VZgQoBegnEj10eDJqA))',
        key: 'vRMoDd5M)SvR0OSzLWQIfw((',
    },
    '7342': {
        client_secret: 'mxH2R184QmhGDrWI1TikaQ((',
        access_token: 'vVGjAoR(qSM7yfA56Atfog))',
        key: 'vqnCl1eW8aKqHEBXFabq7Q((',
    },
    '7343': {
        client_secret: 'ae5OXiV4C2OtuPWFjVuoXQ((',
        access_token: 'oYFcVO3QDnl(91sSUjThNA))',
        key: 'LrB92oMtLUnGJ5uyZvA)bw((',
    },
    '7344': {
        client_secret: '1iPAaK1iEz1gYlrJ73Yi4w((',
        access_token: '7QlDCIzxwizwdUisKiv9gg))',
        key: 'Ctt)0cvvDQttNSj9wmv38g((',
    },
};

var CLIENT_IDS = Object.keys(SO_APPS);
var nextApp = 0;
var nextClientId = CLIENT_IDS[nextApp];

var stopRequests = false;
var delay = 34; // 34 ms to assure that there will be no more than 30 requests per second.
var selectedProject;
var stopWords = [];
var firstTime = true;

module.exports = function (Expertise) {
    return {
        GitHub: function (option, id) {
            var Project = mongoose.model('Project');
            Project.findById(id, function(err, project){
                if(err){
                    console.log('=== Error Project: ' + err.message);
                } else {
                    selectedProject = project;
                }
            });
            var intervalProject = setInterval(function () {
                if(selectedProject){
                    stopProject();
                }
            }, 1000);

            function stopProject(){
                clearInterval(intervalProject);
                switch (option) {
                    case 'Developer':
                        populateContributors(id);
                        break;
                    case 'Issue':
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
                    case 'Event':
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
            }

        },
        StackOverflow: function (option, projectId = '') {
            switch (option) {
                case 'Developer':
                    var interval = setInterval(function () {
                        if(populated.Developer === READY){
                            stop();
                        }
                    }, 2000);

                    function stop(){
                        clearInterval(interval);
                        populateStackOverflowUserData(projectId);
                    }
                    break;
                case 'Tag':
                    populateTags();
                    break;
                case 'CoOccurrence':
                    populateCoOccurrences();
                    break;
            }
        },
        check: function (option) {
            return populated[option] || 202;
        }
    }
}
/** Populate all the CoOccurrences of tags on the database. CoOccurrences are
* given related tags.
* @see {@link https://api.stackexchange.com/docs/related-tags|Related Tags}
* @see populateUserTags
*
* @param {string} filter - The filter to be used on the StackExchange API.
* @param {string} site - The StackExchange network to pull the data from.
**/
function populateCoOccurrences(filter = '!bNKX0pf0ks0KAn', site = 'stackoverflow'){
    var Tag = mongoose.model('Tag');
    var dbStream = Tag.find().lean().cursor();

    var buildModels = function (results) {
        var CoOccurrence = mongoose.model('CoOccurrence');
        var tag = results[0]; //First item is the 'requested' tag

        for(var i = 1; i < results.length; i++){
            var result = results[i];
            var coOccurrence = {
                source: tag.name,
                target: result.name,
                occurrences: result.count,
            };

            CoOccurrence.update(coOccurrence, {occurrences: result.count},
              {upsert: true}, function (err) {
                if(err){
                    console.log('=== Error CoOccurrence: ' + err.message);
                }
            });
        }
    }

    dbStream.on('data', function (tag) {
        var url = 'tags/' + tag._id + '/related?order=desc&sort=popular';
        url += '&site=' + site;
        url += '&filter=' + filter;

        setTimeout(function () {
            soPopulate('CoOccurrence', url, buildModels);
        }, delay);
    });
}

/** Populate all the tags present in a specified StackExchange network.
* @see {@link https://api.stackexchange.com/docs/tags|Tags}
* @see populateUserTags
*
* @param {string} filter - The filter to be used on the StackExchange API.
* @param {string} site - The StackExchange network to pull the data from.
**/
function populateTags(filter = '!4-J-dto(jg0aSjE(E', site = 'stackoverflow'){
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

        Tag.create(tags, function (err, tags) {
            if(err){
                console.log(err.message);
            } else {
                console.log('Tags created');
            }
        });
    }

    soPopulate('Tag', url, buildModels);
}

/** Populate questions, answers and tags related to users from a specific GitHub
* project.
* @see populateAnswers
* @see populateQuestion
* @see populateUserTags
*
* @param {int} projectId - Id from a GitHub project.
**/
function populateStackOverflowUserData(projectId){
    var GitHubProfile = mongoose.model('GitHubProfile');
    var filter = {
        repositories: projectId,
        email: {$exists: true},
    }
    GitHubProfile.find(filter).select('email').lean().exec(function (err, gh){
        if(err){
            console.log(err);
        } else {
            var emails = gh.map(function (profile) {
                return profile.email;
            });
            findStackOverflowMatches(emails);
        }
    });

    function partialUsers(users){
        var ids = '';
        for(var user of users){
            ids += user._id + ';';
        }

        ids = ids.slice(0, -1); // Remove last unecessary semicolon

        if(ids.length > 0 && !stopRequests){
            populateAnswers(ids, projectId, '!FcbKgR9VoP8kZFhRg5uitziPRm');
            populateQuestions(ids, projectId, '!.FjwPG4rNrCRp8_giA4)OJE9BA8N-');
            populateUserTags(ids, projectId, '!bMMRSq0xzD.9EI');
        }
    }

    function findStackOverflowMatches(emails){
        var SoProfile = mongoose.model('StackOverflowProfile');
        var filter = {
            email: {
                $in: emails,
            },
            'isPopulated.all': false,
        }

        SoProfile.find({email: {$in: emails}}).select('_id')
        .lean().exec(function(err, devs){
            while(devs.length > 100){
                var dev_part = devs.splice(0, 100);
                partialUsers(dev_part);
            }
            partialUsers(devs);
        });
    }
}

/** Populate all the user tags from StackOverflow using the soPopulate function.
* User tags are provided by the endpoint @see {@link https://api.stackexchange.com/docs/tags-on-users|Tags on users}
*
* @param {string} ids - A string with up to 100 StakOverflow ids.
    @see {@link https://api.stackexchange.com/docs/tags-on-users|Tags on users} for more information.
* @param {int} projectId - Id of a GitHub project. This is used to filter
    the users on saving, since some ids are repeated.
* @param {string} filter - The filter to be used on the StackExchange API. This is generated by the API.
    @see {@link https://api.stackexchange.com/docs/tags-on-users#pagesize=100&order=desc&sort=popular&ids=696885&filter=!4-J-dtwSuoIA.NOpA&site=stackoverflow|Example Filter}
* @param {string} site - The StackExchange network to pull the data from.
**/
function populateUserTags(ids, projectId, filter = 'default', site = 'stackoverflow'){
    var url = 'users/' + ids + '/tags?order=desc&sort=popular';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var Tag = mongoose.model('Tag');
    var SoProfile = mongoose.model('StackOverflowProfile');

    var findTags = function (tag, result){
        Tag.findOne({_id: tag._id}, function (err, dbTag){
            if(dbTag){
                tag.soCount = dbTag.soTotalCount;
            } else {
                //TODO: Change this to fetch the count from SO
                tag.soCount = tag.count;
            }

            var filter = {
                _id: result.user_id,
            }

            var updateFields = {
                $addToSet: {
                    tags: tag,
                },
                'isPopulated.tags': true,
            };

            SoProfile.update(filter, updateFields).exec(function(err){
                if(err){
                    console.log('=== Error UserTags: ' + err.message);
                } else {
                    // console.log('User ' + result.user_id + ': tags updated!');
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

/** Populate answers from StackOverflow using the soPopulate function.
* Answers can be populated based on users or not.
* @see {@link https://api.stackexchange.com/docs/answers-by-ids | Answers by ids}.
* @see {@link https://api.stackexchange.com/docs/answers-on-users | Answers on users}
* @see populateUserTags
*
* @param {string} ids - A string with up to 100 StakOverflow ids. This will be considered users ids if the obj is 'users/'.
* @param {int} projectId - Id of a GitHub project. This is used to filter
    the users on saving, since some ids are repeated.
* @param {string} filter - The filter to be used on the StackExchange API.
* @param {string} obj - If 'users/' will get the answers related to given user ids.
    If 'questions/' will get answers related to given questions. If '' will get
    answers with the given ids.
* @param {string} site - The StackExchange network to pull the data from.
**/
function populateAnswers(ids, projectId, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/answers?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var SoProfile = mongoose.model('StackOverflowProfile');

    var buildModels = function(items){
        for(var result of items){
            var answer = {
                _id: result.answer_id,
                questionId: result.question_id,
                body: result.body,
                title: result.title,
                score: result.score,
                tags: result.tags,
                //Time comes in seconds on the Stack Exchange API
                createdAt: new Date(result.creation_date * 1000),
                updatedAt: new Date(result.last_activity_date * 1000)
            };

            var filter = {
                _id: result.owner.user_id,
            }

            var updateFields = {
                $addToSet: {
                    answers: answer,
                },
                'isPopulated.answers': true,
            };

            SoProfile.update(filter, updateFields).exec(function (err){
                if(err){
                    console.log('=== Error Answers: ' + err.message);
                } else {
                    // console.log(result.owner.user_id + ' answers updated!');
                }
            });
        }

    }

    soPopulate('Answer', url, buildModels);
}

/** Populate answers from StackOverflow using the soPopulate function.
* Answers can be populated based on users or not.
* @see {@link https://api.stackexchange.com/docs/questions-by-ids | Questions by ids}.
* @see {@link https://api.stackexchange.com/docs/questions-on-users | Questions on users}
* @see populateUserTags
*
* @param {string} ids - A string with up to 100 StakOverflow ids. This will be considered users ids if the obj is 'users/'.
* @param {int} projectId - Id of a GitHub project. This is used to filter
    the users on saving, since some ids are repeated.
* @param {string} filter - The filter to be used on the StackExchange API.
* @param {string} obj - If 'users/' will get the questions related to given user ids.
    If 'questions/' will get questions related to given questions. If '' will get
    questions with the given ids.
* @param {string} site - The StackExchange network to pull the data from.
**/
function populateQuestions(ids, projectId, filter = 'default', obj = 'users/', site = 'stackoverflow'){

    var url = obj + ids + '/questions?order=desc&sort=activity';
    url += '&site=' + site;
    url += '&filter=' + filter;

    var StackOverflowProfile = mongoose.model('StackOverflowProfile');

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
                _id: result.owner.user_id,
            }

            var updateFields = {
                $addToSet: {
                    questions: question,
                },
                'isPopulated.questions': true,
            };

            StackOverflowProfile.update(filter, updateFields).exec(function (err){
                if(err){
                    console.log('=== Error Questions: ' + err.message);
                } else {
                    // console.log(result.owner.user_id + ' questions updated!');
                }
            });
        }
    }

    soPopulate('Question', url, buildModels);
}

/** Fetch all the languages used in a GitHub project and update the database.
*
* @param {int} projectId - Id from a GitHub project.
**/
function populateLanguages(projectId){
    var url = projectId + '/languages';

    var buildModels = function(results){
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

        selectedProject.languages = languages;
        selectedProject.save();
    }
    gitHubPopulate('Language', url, buildModels);
}

/** Populate Issues from a specific project on GitHub.
* It creates 'tags' based on the text of the issue and on the StackOverflow tags.
* On GitHub, Pull Requests are issues and they are fetched in this same function,
* they are saved in the database with the 'isPR' attribute equals to true.
* To avoid throttle problems, only the new issues are fetched (once there is at least one in the database).
* @see {@link https://developer.github.com/v3/issues/|Issues API}
*
* @param {int} projectId - Id of a GitHub repository.
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

        var buildModels = function (results) {
            for(var result of results) {
                var bug = {
                    _id: 'GH' + result.id,
                    title: result.title,
                    body: result.body,
                    status: result.state,
                    labels: [],
                    createdAt: new Date(result.created_at),
                    author: result.user.login,
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

                for(var assignee of result.assignees){
                    var new_assignee = {
                        username: assignee.login,
                    }
                    ghIssue.assignees.push(new_assignee);
                }


                if(result.pull_request){
                    ghIssue.isPR = true;
                }

                for(var label of result.labels){
                    bug.labels.push(label.name);
                }

                makeTags(bug);
                save(ghIssue, 'GitHubIssue');
            }
        }

        gitHubPopulate('Issue', url, buildModels);
    });
}

/** Create the 'GitHubProfile' for the contributors of the project.
* If the developer is already on the database, add it as contributor.
*
* @param {int} projectId - Id of a GitHub repository.
**/
function populateContributors(projectId){
    var url = projectId + '/contributors';
    var GitHubProfile = mongoose.model('GitHubProfile');

    var updateEmail = function (result) {
        if(result.email){
            var filter = {
                _id: result.login,
            }

            var updateFields = {
                email: result.email || '',
            };

            var findCallback = function (err) {
                if(err){
                    console.log('=== Error GitHubProfile: ' + err.message);
                }
            }

            GitHubProfile.update(filter, updateFields, findCallback);
        }
    }

    var buildModels = function (results) {
        for (var result of results) {
            var updateFields = {
                _id: result.login,
                $addToSet: {
                    repositories: projectId,
                },
            };

            var options = {
                upsert: true,
                new: true,
            }

            var findCallback = function (err, dev) {
                if(err){
                    console.log('=== Error GitHubProfile: ' + err.message);
                    return null;
                }

                var user_url = 'https://api.github.com/users/' + dev._id;
                if(!dev.email){
                    gitHubPopulate('Contributor', user_url, updateEmail, undefined, true);
                }
            }

            GitHubProfile.findByIdAndUpdate(result.login, updateFields, options, findCallback);
        }
    }

    gitHubPopulate('Developer', url, buildModels);
}

/** Fetch all the commits of a given repository. Only commits modified after the
* last one in the database are fetched. Commits are ordered in descending order.
* @see {@link https://developer.github.com/v3/repos/commits/|Commits API}
*
* @param {int} projectId - Id of a GitHub project.
**/
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

/** Fetch all Issue Events. Issue Events are the 'history' of that issue and show
* when it was referenced by a commit (or comment), when it was closed, opened,
* assigned (or deassigned) to someone.
* @see {@link https://developer.github.com/v3/issues/events/|Issue Events API}
*
* @param {int} projectId - Id of a GitHub project.
**/
function populateEvents(projectId){
    var url = projectId + '/issues/events'
    var Event = mongoose.model('Event');

    var buildModels = function (results) {
        var events = [];
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

                if(result.issue.pull_request){
                    issueEvent.isPrEvent = true;
                }

                events.push(issueEvent);
            }
        }

        Event.create(events, function(err){
            if(err){
                console.log('=== Error Event: ' + err.message);
            } else {
                console.log('Events Created');
            }
        });

    }
    gitHubPopulate('Event', url, buildModels, selectedProject.eventsEtag);
}

/** Fetch comments from a repository. They may be on issue or commits, depending
* on what is specified by who calls this function. Commit Comments cannot be sorted,
* or filtered. So, when calling this for commits comments, it will always get ALL
* the comments on commits of this repository! Issue Comments can be filtered by
* date, so only new ones are fetched when calling this for issue comments.
* @see {@link https://developer.github.com/v3/repos/comments/|Commit Comments API}
* @see {@link https://developer.github.com/v3/issues/comments/|Issue Comments API}
*
* @param {int} projectId - Id of a GitHub project.
* @param {string} type - Issue or Commit
**/
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
            if(lastCreated){
                lastCreated.createdAt.setSeconds(lastCreated.createdAt.getSeconds() + 1);
                url += '&since=' + lastCreated.createdAt.toISOString();
            }
        } else {
            url += '/comments';
        }

        gitHubPopulate(type + 'Comment', url, buildModels);
    });
}

/** Basic flow for GitHub requests. This handles the pagination and eventual errors,
* so every GitHub request should be made though this function.
* @see {@link https://developer.github.com/v3/|GitHub API overview}
*
* @param {string} option - The option that is being populated now. It's used to
* check the request status later. It can be Issue, Comment, Developer, etc.
* @param {string} specificUrl - The url that will be appended to the base one.
* @param {function} callback - The function to call when the results are received.
    This should handle the creation or the updating of models in the database.
* @param {string} etag - GitHub API Etag to avoid repeated requests
* @param {boolean} finalUrl - If set to true, specificUrl will be considered the
    endpoint of the request (without any other aditional parameters). If false,
    specificUrl will be added to the base url 'https://api.github.com/repositories'
    and will have a 'per_page' attribute added to the end.
**/
function gitHubPopulate(option, specificUrl, callback, etag = undefined, finalUrl = false){
    var uri = specificUrl;
    if(!finalUrl) {
        uri = 'https://api.github.com/repositories/' + specificUrl;
        uri += specificUrl.lastIndexOf('?') < 0 ? '?' : '&';
        uri += 'per_page=100';
    }

    var options = {
        headers: {
            'User-Agent': 'TaskAssignment/software-expertise',
            Accept: 'application/vnd.github.v3+json',
        },
        uri: uri,
        auth:{
            bearer: '19e383c976807df0359e36ba05938027e4a20c45',
        }
    };

    if(etag){
        options.headers['If-None-Match'] = etag;
    }

    var firstRequest = true;

    var requestCallback = function (error, response, body){
        if (!error) {
            switch (response.statusCode) {
                case 200:
                    var results = JSON.parse(body);
                    if(firstRequest){
                        selectedProject.eventsEtag = response.headers.etag;
                        selectedProject.save();
                        firstRequest = false;
                    }
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
                case 304:
                    console.log('No new changes to the option on github');
                    console.log(body, response.statusCode);
                    console.log('*** DONE ***', option);
                    populated[option] = READY;
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

/** Basic flow for StackExchange requests. This handles the pagination and eventual errors,
* so every StackExchange request should be made though this function.
* @see {@link https://api.stackexchange.com/docs|StackExchange API overview}
* @see {@link https://api.stackexchange.com/docs/compression|Compression}
*
* @param {string} option - The option that is being populated now. It's used to
* check the request status later. It can be Tag, CoOccurrence, Question, etc.
* @param {string} specificUrl - The url that will be appended to the base one.
* @param {function} callback - The function to call when the results are received.
    This should handle the creation or the updating of models in the database.
**/
function soPopulate(option, specificUrl, callback) {
    var uri = 'https://api.stackexchange.com/2.2/' + specificUrl + '&pagesize=100';
    var final_uri = uri + '&key=' + SO_APPS[nextClientId].key + '&access_token=' +
      SO_APPS[nextClientId].access_token + '&page=1';

    var options = {
        headers: {
            'Accept-Encoding': 'gzip',
        },
        gzip: true,
        uri: final_uri,
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
                        var new_uri = uri + '&key=' + SO_APPS[nextClientId].key +
                          '&access_token=' + SO_APPS[nextClientId].access_token +
                          '&page=' + (parseInt(results.page) + 1);
                        options.uri = new_uri;

                        request(options, requestCallback);
                    } else {
                        console.log(option + ' done!');
                        populated[option] = READY;
                    }
                    break;
                case 400:
                case 401:
                case 402:
                case 406:
                case 502:
                    console.log('Error Related to token. Trying a different one');
                    console.log(body);
                    console.log(options.uri);
                    nextApp = (nextApp + 1) % CLIENT_IDS.length;
                    nextClientId = CLIENT_IDS[nextApp];
                    if(nextApp === 0){
                        stopRequests = true;
                    } else {
                        var page = '&' + final_uri.split('&').pop();
                        final_uri = uri + '&key=' + SO_APPS[nextClientId].key +
                          '&access_token=' + SO_APPS[nextClientId].access_token +
                          page;
                        options.uri = final_uri;
                        request(options, requestCallback);
                    }
                    break;
                case 500:
                case 503:
                    console.log('SE Server Error. Trying again in one second');
                    console.log(options.uri);
                    console.log(body, response.statusCode);
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

/** When some errors occur, the populate functions will reattemp to make the request.
* If the error persists, this will terminate the requests to avoid throttle problems.
*
* @param {object} options - The options for the request. This may include the type
    of request, compression, url and other things.
* @param {function} requestCallback - The function to handle the requests. This is
    the responsible for pagination and sending the results to their specific handlers.
**/
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
