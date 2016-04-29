var fs = require('fs');
var cf = require('crossfilter');
var d3 = require("d3");
var http = require('http');

var https = require('https');
(function () {
    'use strict';
    Array.prototype.getUnique = function(){
        var u = {}, a = [];
        for(var i = 0, l = this.length; i < l; ++i){
          if(u.hasOwnProperty(this[i])) {
             continue;
          }
          a.push(this[i]);
          u[this[i]] = 1;
        }
        return a;
    }
  /* jshint -W098 */
  // The Package is past automatically as first parameter
  module.exports = function (BaseFrame, app, auth, database) {
    console.log('load data files 0/3');
    var coOccurrencesData;
    var fileName = 'coOccurrences.tsv';
    var coOccurrences;
    var tag1Filter;
    var tag2Filter;
    var cooccurenceFilter;

    var commonUserData;
    var commonUserDataCF;
    var commonUserFilter;
    var TagCountServices = {};
    var graphConfig;

    fs.readFile(fileName, 'utf8', function (err, result){
        if(err)  console.error(err);
        else {
            result = d3.tsv.parse(result);
            console.log('load data files 1/3');
            coOccurrencesData = result;
            coOccurrences = cf(result);
            tag1Filter = coOccurrences.dimension(function(d) { return d; });
            cooccurenceFilter = coOccurrences.dimension(function(d) { return d.CoOccurrence; });
            cooccurenceFilter.filter( function(d){ return d >= 10; } );
            fs.readFile('tags.tsv', 'utf8', function (err, result){
                if(err) console.error(err);
                else {
                    var convertResults = d3.tsv.parse(result);

                    console.log('load data files 2/3');
                    for(var i = 0; i < convertResults.length; i++){
                        var tag = convertResults[i];
                        TagCountServices[tag.TagName] = {
                            Id: tag.Id,
                            TagName: tag.TagName,
                            Count: tag.Count
                        };
                    }
                    fs.readFile('commonUsers.tsv', 'utf8', function(err, result){
                        if(err) console.error(err);
                        else {
                            var commonUserResult = d3.tsv.parse(result);

                            console.log('load data files 3/3');
                            commonUserData = commonUserResult;
                            commonUserDataCF = cf(commonUserResult);
                            commonUserFilter = commonUserDataCF.dimension(function(d) { return d.login; });
                        }
                    });
                }
            });
        }
    });

    app.post('/api/baseFrame/soTags',function(req,res,next){
        res.send(JSON.stringify(TagCountServices));
    });

    app.post('/api/baseFrame/soIDFromUser', function(req, res, next){
        if(req.body.getAll == 'true'){
            commonUsers.filter(null);
        } else {
            commonUserFilter.filter(req.body.gitName);
        }

        res.send(JSON.stringify(commonUserFilter.top(Infinity)));
    });
    function calculateSimilarity (bugTags, userTags, TagCountServices){
        var countValues = function(ary, classifier) {
            return ary.reduce(function(counter, item) {
                var p = (classifier || String)(item);
                counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
                return counter;
            }, {})
        }
        var bugTagCounts = countValues(bugTags);
        var userTagCounts = countValues(userTags);
        function calculateCosineSimilarity (){
            var nominatorSum=0;
            var uniqueBugTags = bugTags.getUnique();
            for (var i =0;i<uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] !== undefined){
                    nominatorSum += bugTagCounts[uniqueBugTags[i]]*userTagCounts[uniqueBugTags[i]];
                }
            }

            var developerSum = 0;
            var uniqueDevTags = userTags.getUnique();

            for (var i = 0; i <uniqueDevTags.length; i++){
                developerSum+= userTagCounts[uniqueDevTags[i]]*userTagCounts[uniqueDevTags[i]];
            }

            var bugSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                bugSum+= bugTagCounts[uniqueBugTags[i]]*bugTagCounts[uniqueBugTags[i]];
            }

            var denominator= Math.sqrt(developerSum) * Math.sqrt(bugSum);
            if (denominator == 0 ){
                console.log('div by 0 err')
                var similarity = 0;
            } else {

                var similarity = nominatorSum / denominator;
            }

            return similarity
        }
        function getSOWeight(soNodeCount) {
            if (graphConfig['soWeight'] == 'linear') {
                return 1 / soNodeCount;
            } else if (graphConfig['soWeight'] == 'log') {
                if (soNodeCount == 1) return 0;
                return 1/ Math.log(soNodeCount);
            } else {
                return 1/Math.sqrt(soNodeCount);
            }
        }

        function getWeightOfNode (nodeCount,nodeName,accessor) {
            if (graphConfig[accessor] == 'sqrt'){
                var weight;
                if (nodeCount === 0){
                    weight = 0;
                } else {
                    weight = (1 / Math.sqrt(nodeCount));
                }

                return weight;

            } else if (graphConfig[accessor] == 'linear') {
                var weight;
                if (nodeCount === 0){
                    weight = 0;
                } else {
                    weight = (1 / nodeCount);
                }
                return weight;

            } else if (graphConfig[accessor] == 'log'){

                var weight;
                if (nodeCount ==1){
                    weight = 0;
                } else if (nodeCount ==0){
                    weight = 0
                } else {
                    weight = 1 / Math.log(nodeCount);
                }
                return weight;

            } else if(graphConfig[accessor] == 'adjusted') {
                var weight;
                var weightSOTag = getSOWeight(TagCountServices[nodeName]);

                weight = 1 - ((1 - weightSOTag) / (nodeCount));

                return weight;
            }

        }
        function calculateJustNodeSimilarity(){
            var nominatorSum = 0;
            var uniqueBugTags = bugTags.getUnique();

            for (var i = 0; i < uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] == undefined) {
                    nominatorSum += bugTagCounts[uniqueBugTags[i]];
                } else {
                    nominatorSum += d3.min([
                            getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight'),
                            getWeightOfNode(userTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight')
                        ]);
                }
            }

            var denominatorSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                denominatorSum += getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight');
            }
            var results;
            if(denominatorSum == 0){
                results = 0;
            } else {
                results = nominatorSum / denominatorSum
            }
            return results;
        }
        function calculateEdgeWeight( occurenceIName, occurenceJName ) {

            var coOIJ; // co occurence I and J
            if(coOccurenceDictionary[occurenceIName + occurenceJName] !== undefined) {
                coOIJ = coOccurenceDictionary[occurenceIName + occurenceJName];
            } else if (coOccurenceDictionary[occurenceJName + occurenceIName] !== undefined) {
                coOIJ = coOccurenceDictionary[occurenceJName + occurenceIName];

            } else {
                return 0;
            }

            if(graphConfig['directed']) {
                return coIJ / TagCountServices[occurenceIName];
            } else {
                return (2*coIJ) / (TagCountServices[occurenceIName] + TagCountServices[occurenceJName]);

            }
        }
        function calculateEdgeOverLap(){
            var nominatorSum = 0;
            var uniqueBugTags = bugTags.getUnique();

            for (var i = 0; i < uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] == undefined) {
                    nominatorSum += bugTagCounts[uniqueBugTags[i]];
                } else {
                    nominatorSum += d3.min([
                            getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight'),
                            getWeightOfNode(userTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight')
                        ]);
                }
            }

            var denominatorSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                denominatorSum += getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight');
            }
            var results;
            if(denominatorSum == 0){
                results = 0;
            } else {
                results = nominatorSum / denominatorSum
            }
            return results;
        }
        function calculateEdgeAndNodeSimilarity(){
            var justNodeSim = calculateJustNodeSimilarity();
        }
        if(graphConfig['similarityType'] == 'jacard') {
            return calculateJustNodeSimilarity();
        } else  {
            return calculateCosineSimilarity();
        }
    }
    app.post('/api/baseFrame/getSimilarity', function(req, res, next){
        var directedGraph = req.body['directed'] == undefined ?
            false : req.body['directed'] == 'false' ?
                false : true;

        var soWeight = req.body['soWeight'];
        var userWeight = req.body['userWeight'];
        var similarityType = req.body['similarity'];
        var commparisonType = req.body['comparisonType'];

        graphConfig = {
            'soWeight': soWeight,
            'userWeight': userWeight,
            'similarityType': similarityType,
            'directed': directedGraph,

        }
        if (commparisonType == 'textToText'){
            var textA = req.body['textA'];
            var textB = req.body['textB'];
            var textAWords = textA.split(' ');
            var textBWords = textB.split(' ');

            var tagsForA = [];
            var tagsForB = [];

            for (var i = 0; i < textAWords.length; i++) {
                if (TagCountServices[textAWords[i]] !== undefined) {
                    tagsForA.push(textAWords[i]);
                }
            }
            for (var i = 0; i < textBWords.length; i++) {
                if (TagCountServices[textBWords[i]] !== undefined) {
                    tagsForB.push(textBWords[i]);
                }
            }
            tagsForB.sort();
            tagsForA.sort();
            var similarityBetweenBugAndUser = calculateSimilarity(tagsForA,tagsForB, TagCountServices);
            res.send(similarityBetweenBugAndUser.toString());

        } else if (commparisonType == 'textToDev') {
            var textA = req.body['textA'];
            var textAWords = textA.split(' ');

            var tagsForA = [];
            for (var i = 0; i < textAWords.length; i++) {
                if (TagCountServices[textAWords[i]] !== undefined) {
                    tagsForA.push(textAWords[i]);
                }
            }
            tagsForA.sort();
            var optionsState = {}
            var user = req.body['userName'];
            var repoName = req.body['repoName'];

            var getReqOptions = {
                host : 'api.github.com',
                protocol:'https:',
                path : '/repos/' + repoName +'/commits?author=' + user +'&per_page=100',
                headers: {
                    'User-Agent':'http://developer.github.com/v3/#user-agent-required'
                }
            }
            var tagsForDev =[];
            var gitReq = https.get(getReqOptions, function(results){
                // Buffer the body entirely for processing as a whole.
                 var bodyChunks = '';
                 results.on('data', function(chunk) {
                   // You can process streamed parts here...
                   bodyChunks+= chunk;
                 }).on('end', function() {
                    var usersResponse = JSON.parse(bodyChunks);


                   for(var i=0;i<usersResponse.length;i++){
                       var wordsFromCommitMessage = usersResponse[i].commit.message.toLowerCase()
                         .split(' ');
                       for(var j=0;j<wordsFromCommitMessage.length;j++){
                           if (TagCountServices[wordsFromCommitMessage[j]] !== undefined) {
                               tagsForDev.push(wordsFromCommitMessage[j]);
                           }
                       }
                   }
                   tagsForDev.sort();

                   var similarityBetweenBugAndUser = calculateSimilarity(tagsForA,tagsForDev, TagCountServices);
                   if(undefined == similarityBetweenBugAndUser ||
                        similarityBetweenBugAndUser == 0) {
                        res.send("0");
                   } else {

                       res.send(similarityBetweenBugAndUser.toString());
                   }

                  });
                   // ...and/or process the entire body here.
            })
        } else {
            var textA = req.body['textA'];
            var textAWords = textA.split(' ');

            var tagsForA = [];
            for (var i = 0; i < textAWords.length; i++) {
                if (TagCountServices[textAWords[i]] !== undefined) {
                    tagsForA.push(textAWords[i]);
                }
            }
            tagsForA.sort();
            var optionsState = {}
            var user = req.body['userName'];
            var repoName = req.body['repoName'];

            var getReqOptions = {
                host : 'api.github.com',
                protocol:'https:',
                path : '/repos/' + repoName +'/commits?author=' + user +'&per_page=100',
                headers: {
                    'User-Agent':'http://developer.github.com/v3/#user-agent-required'
                }
            }
            var tagsForDev =[];
            var gitReq = https.get(getReqOptions, function(results){
                // Buffer the body entirely for processing as a whole.
                 var bodyChunks = '';
                 results.on('data', function(chunk) {
                   // You can process streamed parts here...
                   bodyChunks+= chunk;
                 }).on('end', function() {
                //    var body = Buffer.concat(bodyChunks);
                    var usersResponse = JSON.parse(bodyChunks);


                   for(var i=0;i<usersResponse.length;i++){
                       var wordsFromCommitMessage = usersResponse[i].commit.message.toLowerCase()
                         .split(' ');
                       for(var j=0;j<wordsFromCommitMessage.length;j++){
                           if (TagCountServices[wordsFromCommitMessage[j]] !== undefined) {
                               tagsForDev.push(wordsFromCommitMessage[j]);
                           }
                       }
                   }
                   tagsForDev.sort();
                   //GET /repos/:owner/:repo/issues/:number/comments

                   var getIssueOptions = {
                       host : 'api.github.com',
                       protocol:'https:',
                       path : '/repos/' + repoName +'/issues',
                       headers: {
                           'User-Agent':'http://developer.github.com/v3/#user-agent-required'
                       }
                   }
                   var issueTags =[];
                   var issueReq = https.get(getIssueOptions, function(issueResults){
                       // Buffer the body entirely for processing as a whole.
                       var matchingIssue;

                        var bodyChunks = '';
                        issueResults.on('data', function(chunk) {
                          // You can process streamed parts here...
                          bodyChunks+= chunk;
                        }).on('end', function() {
                       //    var body = Buffer.concat(bodyChunks);
                           var issueResponse = JSON.parse(bodyChunks);
                        //    console.log(issueResponse);
                           var issues = [];
                            // issue matching deep linking
                            var matchingIssue;
                            for (var i = 0; i < issueResponse.length; i++) {
                                if (req.body['issueNumb'] == issueResponse[i].id) {
                                    matchingIssue = issueResponse[i];
                                }
                            }
                            var issueText ='';
                            issueText += matchingIssue.title;
                            issueText += matchingIssue.body;

                            var wordsFromIssues = issueText.split(' ');

                            var tagsForIssue = [];
                            for (var i = 0; i < wordsFromIssues.length; i++) {
                                if (TagCountServices[wordsFromIssues[i]] !== undefined) {
                                    tagsForIssue.push(wordsFromIssues[i]);
                                }
                            }
                            tagsForIssue.sort();
                            var similarityBetweenBugAndUser = calculateSimilarity(tagsForIssue,tagsForDev, TagCountServices);
                            if(undefined == similarityBetweenBugAndUser ||
                                 similarityBetweenBugAndUser == 0) {
                                 res.send("0");
                            } else {

                                res.send(similarityBetweenBugAndUser.toString());
                            }
                        });
                          // ...and/or process the entire body here.
                   })
                  });
                   // ...and/or process the entire body here.
            })
        }

    })
    app.post('/api/baseFrame/coOccurence', function (req, res, next) {
        var stringRes = '';
        if (req.body['getEverything'] == "true"){

             tag1Filter.filter(null);

             var f1Data =tag1Filter.top(Infinity);

          res.send(JSON.stringify(f1Data));
          tag1Filter.filter();

        } else {
          var tagsToFilter;
          for(var key in req.body) {
              if(req.body.hasOwnProperty(key))
              {
                  tagsToFilter = req.body[key];
              }
          }
          //These tags com from 'displayIssueTags' on repository.js
          console.log(tagsToFilter);

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

    });
  };
})();
