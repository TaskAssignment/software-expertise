'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var CommonOccurrence = mongoose.model('CommonOccurrence');
var StopWord = mongoose.model('StopWord');
var Issue = mongoose.model('Issue');

var pullAll = require('lodash.pullall');

module.exports = function (BaseFrame){

    function getIssues(stopWords, filter) {
        Issue.find(filter, '_id body title', {lean: true}, function (err, issues){
            console.log(issues);
            for(var i in issues){
                var issue = issues[i];

                var title = issue.title.toLowerCase().split(' ');
                var allWords = new Set(issue.body.toLowerCase().split(' '));

                for(var j in title) {
                    var word = title[j];
                    allWords.add(word);
                }

                allWords = Array.from(allWords)
                //Lodash pullAll: removes the second array from the first one.
                pullAll(allWords, stopWords);
                getTags(allWords, issue._id);
            }
        });
    }

    function getTags(issueWords, issueId){
        Tag.find({_id: {$in: issueWords }}, '_id soTotalCount', {lean: true}, function(err, tags){
            var issueUpdate = {
                tags: [],
            }
            for(var i in tags){
                var tag = tags[i];

                var issueTag = {
                    _id: tag._id,
                    soCount: tag.soTotalCount,
                    //I don't have the count for the issue right now.
                    issueCount: 1
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
        */
        makeIssuesTags: function(req, res){
            var filter = {
                projectId: req.params.projectId,
                parsed: false,
                pull_request: false
            };

            if(req.query._id){
                filter = {
                    _id: req.query._id
                };
            }

            StopWord.find({}, '_id', {lean: true}, function (err, words){
                if(err) {
                    console.log(err.message);
                } else {
                    var stopWords = []
                    for(var index in words){
                        stopWords.push(words[index]._id);
                    }

                    getIssues(stopWords, filter);
                }
            });
            res.sendStatus(200);
        },



        /** Gets the coOccurrences from a list of tags
        *
        * @param req - Express request.
        * @param res - Express response.
        */
        coOccurrence: function (req, res) {
            var tags = req.body.tags.split(',');
            tags = tags.slice(0, -1); //Remove the last empty string

            var conditions = {
                $and:
                  [{source: {$in: tags}} ,
                  {target: {$in: tags}} ]
            }

            CommonOccurrence.find(conditions, function(err, occurrences){
                res.json(occurrences);
            });
        }
    }
}
