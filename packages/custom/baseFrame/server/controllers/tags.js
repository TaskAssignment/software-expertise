'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var CoOccurrence = mongoose.model('CoOccurrence');
var StopWord = mongoose.model('StopWord');
var Issue = mongoose.model('Issue');

module.exports = function (BaseFrame){

    function getIssues(stopWords, filter, res, project) {
        Issue.find(filter, '_id body title', {lean: true}, function (err, issues){
            if(err){
                console.log(err.message);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }
            for(var i in issues){
                var issue = issues[i];

                var title = issue.title + ' ' + project.description;
                title = title.toLowerCase().split(' ');

                var body = [];
                if(issue.body){ //It may not have a body.
                    body = issue.body.toLowerCase().split(' ');
                }

                var allWords = {};

                if(project.languages){
                    for(var l in project.languages){
                        var lang = project.languages[l];
                        allWords[lang._id] = 1;
                    }
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

                for(var l in stopWords){
                    var word = stopWords[l];

                    // If a stop word is in my all words, I remove it.
                    if(allWords[word]){
                        delete allWords[word];
                    }
                }

                getTags(allWords, issue._id);
            }
            if(!res.headersSent){
                res.sendStatus(200);
            }
        });
    }

    function getTags(issueWords, issueId){
        Tag.find({_id: {$in: Object.keys(issueWords) }}, '_id soTotalCount', {lean: true}, function(err, tags){
            var issueUpdate = {
                tags: [],
            }
            for(var i in tags){
                var tag = tags[i];

                var issueTag = {
                    _id: tag._id,
                    soCount: tag.soTotalCount,
                    //I don't have the count for the issue right now.
                    issueCount: issueWords[tag._id]
                };

                issueUpdate.tags.push(issueTag);
            }
            issueUpdate.parsed = true;

            Issue.update({_id: issueId}, issueUpdate, function (err){
                if(err){
                    console.log(err.message);
                } else {
                    console.log("Issue updated!");
                }
            });
        });
    }

    return {

        /** Gets the words that are SO Tags given an issue text.
        *
        * @param req - Express request.
        * @param res - Express response.
        **/
        makeIssuesTags: function(req, res){
            var filter = {
                projectId: req.params.projectId,
                pull_request: false
            };

            if(req.query._id){
                filter = {
                    _id: req.query._id
                };
            }

            filter.parsed = false;

            var project = JSON.parse(req.query.project);

            StopWord.find({}, '_id', {lean: true}, function (err, words){
                if(err) {
                    console.log(err.message);
                } else {
                    var stopWords = [];
                    for(var index in words){
                        stopWords.push(words[index]._id);
                    }

                    getIssues(stopWords, filter, res, project);
                }
            });
        }
    }
}
