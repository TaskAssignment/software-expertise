'use strict';

// Database connections
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var CommonOccurrence = mongoose.model('CommonOccurrence');
var StopWord = mongoose.model('StopWord');

var pullAll = require('lodash.pullall');

module.exports = function (BaseFrame){
    return {
        getIssueTags: function(req, res){
            var issue = req.body;

            var title = issue.title.toLowerCase().split(' ');
            var allWords = issue.body.toLowerCase().split(' ');

            for(var index in title) {
                var word = title[index];
                allWords.push(word);
            }

            StopWord.find({}, '_id', {lean: true}, function (err, words){
                if(err) {
                    console.log(err.message);
                } else {
                    var stopWords = []
                    for(var index in words){
                        stopWords.push(words[index]._id);
                    }
                    pullAll(allWords, stopWords);
                }

                // Any tag that has any of the words in the given array
                // The lean option is to avoid Mongoose wrapers. It returns just a json
                Tag.find({_id: {$in: allWords }}, '_id soTotalCount', {lean: true}, function(err, tags){
                    if(err){
                        console.log(err.message);
                        res.sendStatus(500);
                    }

                    var tagsFromIssue = {};
                    for(var index in tags){
                        //I don't have the count for the issue right now.
                        tagsFromIssue[tags[index]._id] = 1;
                    }

                    res.json(tagsFromIssue);
                });
            });
        },

        coOccurrence: function (req, res) {
            //These tags come from 'displayIssueTags' on repository.js
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
