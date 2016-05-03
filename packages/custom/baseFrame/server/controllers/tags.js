'use strict';

//Module dependencies (following the Articles model)
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var SoUser = mongoose.model('SoUser');
// var CommonOccurrence = mongoose.model('CommonOccurrence');
var config = require('meanio').loadConfig();
var _ = require('lodash');

var fs = require('fs');
var cf = require('crossfilter');
var d3 = require('d3');

module.exports = function (Tags){
    console.log('load data files 0/3');
    var commonUserDataCF;
    var commonUserFilter;

    var coOccurrencesData;
    var coOccurrences;
    var tag1Filter;
    var coOccurrenceFilter;

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
            fs.readFile('coOccurrences.tsv', 'utf8', function (err, result){
                if(err)  console.error(err);
                else {
                    result = d3.tsv.parse(result);
                    console.log('Load data file: coOccurrences.tsv');
                    coOccurrencesData = result;
                    coOccurrences = cf(result);
                    tag1Filter = coOccurrences.dimension(function(d) { return d; });
                    coOccurrenceFilter = coOccurrences.dimension(function(d) { return d.CoOccurrence; });
                    coOccurrenceFilter.filter( function(d){ return d >= 10; } );
                }
            });
            res.json('success CommonOccurrences');
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

            Tag.find({}, 'name soTotalCount', function(err, tags){
                if(err){
                    console.log(err.msgerror);
                    return {};
                }
                /*I know that this is not much better than reading the file
                * everytime, but the collection that mongodb returns is an
                * array, and looking for each word would require even more interactions
                */
                for(var index in tags){
                    allTags[tags[index].name] = tags[index].soTotalCount
                }
                var issue = req.body;

                var title = issue.title.toLowerCase().split(' ');
                var body = issue.body.toLowerCase().split(' ');

                for(var index in title) {
                    var word = title[index];
                    checkWord(word);
                }

                for(var index in body) {
                    var word = body[index];
                    checkWord(word);
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

        },

        coOccurrence: function (req, res) {
            //These tags come from 'displayIssueTags' on repository.js
            var tagsToFilter = [];
            // console.log(req.body);
            // for(var key in req.body) {
            //   if(req.body.hasOwnProperty(key))
            //   {
            //     tagsToFilter = req.body[key];
            //   }
            // }
            //
            // tag1Filter.filter(function(d,i){
            //   if(tagsToFilter.indexOf(d.Tag1) !== -1 &&
            //   tagsToFilter.indexOf(d.Tag2) !== -1){
            //     return true;
            //   } else {
            //     return false;
            //   }
            // });
            //
            // var f1Data = tag1Filter.top(Infinity);
            // console.log(f1Data);


            res.send(JSON.stringify({}));
        }
    }
}
