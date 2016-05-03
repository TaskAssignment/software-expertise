'use strict';

//Module dependencies (following the Articles model)
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var SoUser = mongoose.model('SoUser');
var CommonOccurrence = mongoose.model('CommonOccurrence');

var fs = require('fs');
var cf = require('crossfilter');
var d3 = require('d3');

module.exports = function (Tags){
    console.log('load data files 0/3');
    return {
        populateSoTags: function (req, res){
            fs.readFile('tags.tsv', 'utf8', function (err, result){
                if(err) console.error(err);
                else {
                    console.log('Load data file: tags.tsv');
                    var convertResults = d3.tsv.parse(result);

                    var tags = [];
                    for(var index in convertResults){
                        var result = convertResults[index];

                        var tag = {};
                        tag['name'] = result.TagName;
                        tag['soTotalCount'] = result.Count;

                        tags.push(tag);
                    }

                    Tag.collection.insert(tags, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Tags saved successfully!');
                        }
                    })
                    res.json('success SoTags');
                  }
            });
        },

        populateCommonOccurrences: function (req, res){
            fs.readFile('coOccurrences.tsv', 'utf8', function (err, results){
                if(err)  console.error(err);
                else {
                    results = d3.tsv.parse(results);
                    console.log('Load data file: coOccurrences.tsv');

                    var occurrences = [];
                    for(var index in results){
                        var result = results[index];

                        var occurrence = {}
                        occurrence['source'] = result.Tag1 ;
                        occurrence['target'] = result.Tag2 ;
                        occurrence['occurrences'] = result.CoOccurrence;

                        occurrences.push(occurrence);
                    }

                    CommonOccurrence.collection.insert(occurrences, function(err){
                        if(err){
                            console.log(err);
                        } else {
                            console.log('Common Occurrences saved!');
                        }
                    });
                    res.json('success CommonOccurrences');
                }
            });
        },

        populateSoUsers: function (req, res){
            fs.readFile('commonUsers.tsv', 'utf8', function(err, result){
                if(err) console.error(err);
                else {
                    var commonUserResult = d3.tsv.parse(result);
                    console.log('Load data file: commonUsers.tsv');
                    var users = []
                    for(var index in commonUserResult){
                        var result = commonUserResult[index];

                        var user = {};
                        user['soId'] = result.SOId;
                        user['gitUsername'] = result.login;
                        user['email'] = result.email;

                        users.push(user);
                    }
                    SoUser.collection.insert(users, function(err){
                        if(err){
                            console.log(err.message);
                        }else{
                            console.log('Users saved successfully!');
                        }
                    })
                    res.json('success CommonOccurrences');
                }
            });
        },

        getIssueTags: function(req, res){
            var allTags = {};
            var tagsFromIssue = {};

            var issue = req.body;

            var title = issue.title.toLowerCase().split(' ');
            var allWords = issue.body.toLowerCase().split(' ');

            for(var index in title) {
                var word = title[index];
                allWords.push(word);
            }
            Tag.find({name: {$in: allWords }}, 'name soTotalCount', function(err, tags){
                if(err){
                    console.log(err.msgerror);
                    return {};
                }

                for(var index in tags){
                    //I don't have the count for the issue right now.
                    tagsFromIssue[tags[index].name] = 1;
                }

                res.send(JSON.stringify(tagsFromIssue));
            });

            function checkWord(word){
                if(allTags[word] !== undefined){
                    if(tagsFromIssue[word] === undefined){
                        tagsFromIssue[word] = 1;
                    }else{
                        tagsFromIssue[word] += 1;
                    }
                }
            }
        },

        soIDFromUser: function(req, res){
            var gitUsername = req.body.gitName;
            SoUser.findOne({gitUsername: gitUsername}, 'soId', {lean:true},
            function(err, user){
                if(user){
                    res.json(user.soId);
                }else {
                    res.json(undefined);
                }
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
                res.send(JSON.stringify(occurrences));
            });
        }
    }
}
