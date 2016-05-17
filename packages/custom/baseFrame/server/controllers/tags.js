'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var CommonOccurrence = mongoose.model('CommonOccurrence');
var StopWord = mongoose.model('StopWord');
var Issue = mongoose.model('Issue');

var pullAll = require('lodash.pullall');

module.exports = function (BaseFrame){
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
            }

            if(req.query.issueId){
                filter._id = req.query.issueId;
            }
            StopWord.find({}, '_id', {lean: true}, function (err,words){
                if(err) {
                    console.log(err.message);
                } else {
                    var stopWords = [];
                    for(var index in words){
                        stopWords.push(words[index]._id);
                    }


                    Issue.find(filter, 'title body', function(err, issues){
                        if(err){
                            console.log(err);
                        }
                        console.log(issues.length);
                        var issue = "";
                        for(var i in issues){

                            issue = issues[i];

                            var title = issue.title.toLowerCase().split(' ');
                            var allWords = issue.body.toLowerCase().split(' ');

                            for(var index in title) {
                                var word = title[index];
                                allWords.push(word);
                            }

                            pullAll(allWords, stopWords);

                            // Any tag that has any of the words in the given array
                            // The lean option is to avoid Mongoose wrapers. It returns just a json
                            Tag.find({_id: {$in: allWords }}, '_id soTotalCount', {lean: true}, function(err, tags){
                                if(err){
                                    console.log(err.message);
                                    res.sendStatus(500);
                                }

                                var tagsFromIssue = [];
                                for(var index in tags){
                                    var tag = tags[index];
                                    var issuetag = {}
                                    issuetag[tag._id] = {
                                        soCount: tag.soTotalCount,
                                        //I don't have the count for the issue right now.
                                        issueCount: 1
                                    };
                                    tagsFromIssue.push(issuetag);
                                }

                                issue.tags = tagsFromIssue;
                                issue.parsed = true;
                                issue.save(function (err){
                                    if(err){
                                        console.log(err.message);
                                    }else{
                                        console.log("Issue updated successfully!");
                                    }
                                });
                            });
                        }
                    });
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
