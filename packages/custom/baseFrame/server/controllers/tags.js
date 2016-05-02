'use strict';

//Module dependencies (following the Articles model)
var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');
var SoUser = mongoose.model('SoUser');
var CommonOccurrence = mongoose.model('CommonOccurrence');
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
                    var convertResults = d3.tsv.parse(result);

                    console.log('Load data file: tags.tsv');
                    for(var index in convertResults){
                        var result = convertResults[index];

                        var tag = new Tag();
                        tag.name = result.TagName;
                        tag.soTotalCount = result.Count;
                        tag.save(function(err){
                            if(err){
                                console.log(err);
                            } else {
                                console.log("Tag created");
                            }
                        });
                    }
                    res.json("success SoTags");
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
            res.json("success CommonOccurrences");
        },

        getIssueTags: function(req, res){
            var issue = req.body;

            var title = issue.title.toLowerCase().split(' ');
            var body = issue.body.toLowerCase().split(' ');
            var tagsFromIssue = {};

            for(var index in title) {
                var word = title[index];
                addWordToIssueTags(word);
            }

            for(var index in body) {
                var word = body[index];
                addWordToIssueTags(word);
            }

            function addWordToIssueTags(word){
                //Check a better way of doing this!!
                Tag.find({name: word},function(err, tags){
                    if(!err){
                        if(tags.length > 0){
                            if(tagsFromIssue[word] === undefined){
                                tagsFromIssue[word] = 1;
                            } else {
                                tagsFromIssue[word] += 1;
                            }
                        }
                    }else{
                        console.log(err);
                    }
                });
            }
            res.send(JSON.stringify(tagsFromIssue));
        },

        soIDFromUser: function(req, res){
            fs.readFile('commonUsers.tsv', 'utf8', function(err, result){
                if(err) console.error(err);
                else {
                    var commonUserResult = d3.tsv.parse(result);
                    console.log('Load data file: commonUsers.tsv');

                    //Save this to Database!!!
                    commonUserDataCF = cf(commonUserResult);
                    commonUserFilter = commonUserDataCF.dimension(function(d) { return d.login; });
                }
                commonUserFilter.filter(req.body.gitName);
                res.send(JSON.stringify(commonUserFilter.top(Infinity)));
            });

        },

        coOccurrence: function (req, res) {
            //These tags come from 'displayIssueTags' on repository.js
            var tagsToFilter = [];
            // console.log(req.body);
            for(var key in req.body) {
              if(req.body.hasOwnProperty(key))
              {
                tagsToFilter = req.body[key];
              }
            }

            tag1Filter.filter(function(d,i){
              if(tagsToFilter.indexOf(d.Tag1) !== -1 &&
              tagsToFilter.indexOf(d.Tag2) !== -1){
                return true;
              } else {
                return false;
              }
            });

            var f1Data = tag1Filter.top(Infinity);
            console.log(f1Data);


            res.send(JSON.stringify(f1Data));
            tag1Filter.filter();
        }
    }
}
