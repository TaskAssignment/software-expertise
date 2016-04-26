var fs = require('fs');
var cf = require('crossfilter');
var tsv = require("node-tsv-json");
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
    var soTAGS;

    var commonUserData;
    var commonUserDataCF;
    var commonUserFilter;
    var TagCountServices ={};
    var graphConfig;
    // d3.tsv('tags.tsv', function(d) { return {Id: d.Id, TagName: d.TagName, Count: d.Count}; },
    // function(error, dataLoaded) {
    //     console.log(dataLoaded[0]);
    //     soTAGS =dataLoaded;

    // var user = req.body['userName'];
    // updateDeeplink();
    // var usersRepos = 'https://api.github.com/users/' +
    //    user +
    //    '/repos';


    // });
    tsv({
            input: fileName,
            output: "output.json",
            //array of arrays, 1st array is column names
            parseRows: false
        }, function(err, result) {
            if(err) {
                console.error(err);
            }else {
                console.log('load data files 1/3');
                coOccurrencesData = result;
                coOccurrences = cf(result);
                tag1Filter = coOccurrences.dimension(function(d) { return d; });
                //   tag2Filter = coOccurrences.dimension(function(d) { return d.Tag2; });
                cooccurenceFilter = coOccurrences.dimension(function(d) { return d.CoOccurrence; });

                cooccurenceFilter.filter(function(d){
                    if( d < 10){
                        return false;
                    } else {
                        return true;
                    }
                });
                tsv({
                    input: 'tags.tsv',
                    output: "output1.json",
                    //array of arrays, 1st array is column names
                    // id: tagname: count:
                    parseRows: false
                }, function(err, convertResults) {
                    if(err) {
                        console.error(err);
                    }else {
                        console.log('load data files 2/3');

                        soTAGS = convertResults;
                        for(var i = 0; i < convertResults.length; i++){
                              TagCountServices[convertResults[i].TagName] = {
                                  Id: +convertResults[i].Id,
                                  TagName: +convertResults[i].TagName,
                                  Count: +convertResults[i].Count
                              };
                          }

                        tsv({
                            input: 'commonUsers.tsv',
                            output: "output3.json",
                            //array of arrays, 1st array is column names
                            // id: tagname: count:
                            parseRows: false
                        }, function(err, commonUserResult) {
                            if(err) {
                                console.error(err);
                            }else {
                                console.log('load data files 3/3');

                                commonUserData = commonUserResult;
                                commonUserDataCF = cf(commonUserResult);
                                commonUserFilter = commonUserDataCF.dimension(function(d) { return d.login; });
                                //   tag2Filter = coOccurrences.dimension(function(d) { return d.Tag2; });
                            }
                        });
                    }
                });

            }
    });
    app.post('/api/baseFrame/soTags',function(req,res,next){
        res.send(JSON.stringify(soTAGS));

    });
    app.post('/api/baseFrame/graphConfig', function(req, res, next){
        var graphConfig = {
            'repoName':undefined,
            'issueId': undefined,
            'userName':undefined,
            'directed':true,
            'soWeight':'log',
            'userWeight':'log',
            'bugWeight':'log',
            'showDirectChildren':false
        };

        res.send(JSON.stringify(graphConfig));
    });
    app.post('/api/baseFrame/soIDFromUser', function(req, res, next){
        // console.log(req.body.gitName);
        if(req.body.getAll == 'true'){
            commonUsers.filter(null);

        } else {

            commonUserFilter.filter(req.body.gitName);
        }
        // console.log(commonUserFilter.top(Infinity));

        res.send(JSON.stringify(commonUserFilter.top(Infinity)));
    });
    function calculateSimilarity (bugTags, userTags, TagCountServices){
        // if()
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


            // updateDeeplink();
            // var usersRepos = 'https://api.github.com/users/' +
            //    user +
            //    '/repos';
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


            // updateDeeplink();
            // var usersRepos = 'https://api.github.com/users/' +
            //    user +
            //    '/repos';
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
        //   d3.tsv().defer(fileName)
        //     .await(function(error,file){
        //             coOccurrencesData = file;
        //     });
        var stringRes = '';
        if (req.body['getEverything'] == "true"){

            //console.log("in get everything");

             tag1Filter.filter(null);

             var f1Data =tag1Filter.top(Infinity);
            // var f2Data = tag2Filter.top(Infinity);
            // var allCoocurrences = f2Data.concat(f1Data);
            // coOccurenceResults  = coOccurenceResults.concat(f1Data);
        // }

          res.send(JSON.stringify(f1Data));
          tag1Filter.filter();

        } else {

          //console.log("NOT in get everything");
         // console.log(req.body['getEverything']);
          // var tagsToFilter = ['d3.js','javascript','jquery','html'];
          var tagsToFilter;
          for(var key in req.body) {
              if(req.body.hasOwnProperty(key))
              {
                  //do something with e.g. req.body[key]
                  // tagsToFilter.push(req.body[key]);
                  tagsToFilter = req.body[key];
              }
          }


          var filterPairings = [];
          // for(var i = 0; i < tagsToFilter.length - 1; i++){ //match all but last
          //     for(var j = i + 1; j < tagsToFilter.length; j++){
          //         filterPairings.push({
          //             'tag1': tagsToFilter[i],
          //             'tag2': tagsToFilter[j]
          //         });
          //     }
          // }
          // res.send(JSON.stringify(filterPairings));

          var coOccurenceResults =[];
          // for(var i = 0; i < filterPairings.length; i++){
          // tag2Filter.filter();
          tag1Filter.filter(function(d,i){

              if(tagsToFilter.indexOf(d.Tag1) !== -1 &&
                  tagsToFilter.indexOf(d.Tag2) !== -1){

                  return true;

              } else {
                  return false;
              }
              // if(filterPairings[i].tag1 === d ||
              //     filterPairings[i].tag2 === d) {
              //     return true;
              // } else {
              //     return false;
              // }
          });
          // tag1Filter.filter();

          var f1Data =tag1Filter.top(Infinity);
          // var f2Data = tag2Filter.top(Infinity);
          // var allCoocurrences = f2Data.concat(f1Data);
          // coOccurenceResults  = coOccurenceResults.concat(f1Data);
      // }

          res.send(JSON.stringify(f1Data));
          tag1Filter.filter();
        }

    });

    // Joel's API Test
    app.get('/api', function (req, res, next) {
      // Could be pulling from Mongo or w/e you want here
      res.send('API is running, we can add any request here');
    });
    app.get('/', function(req, res){
        res.send('hello world');
    });

    // Joel's API Test w/ params
    app.post('/api/fuzzyDistance', function (req, res, next) {
      // Could be pulling from Mongo or w/e you want here
        var paramString = '';
        for(var key in req.body) {
            if(req.body.hasOwnProperty(key))
            {
                //do something with e.g. req.body[key]
                paramString = paramString + ' ' + key + ': ' + req.body[key] + '\n';
            }
        }
        res.send(paramString);
      //res.send('Stack Overflow ID: ' + req.body.stackId + '\nGithub ID: ' + req.body.githubId +
      //    '\nUsername: ' + req.body.name + '\nKeyword: ' +  req.body.keyword);
    });
    // app.get('/api/coOccurence', function(req,res){
    //     // console.log('hit')
    //     // var fileName = '../models/data.tsv';
    //     //
    //     // var readStream = fs.createReadStream(fileName);
    //     res.writeHead(200,{'Content-Type': 'text/tab-separated-values'});
    //     //
    //     // rs.on('readable',function (){
    //     //     var d = rs.read();
    //     //     if(typeof d == 'string'){
    //     //         res.write(d);
    //     //     } else if (typeof d = 'object' && d instanceof Buffer){
    //     //         res.write(d.toString('utf8'));
    //     //     }
    //     // });
    //     // rs.on('end',function(){
    //     //     res.end();
    //     // });
    // });

    app.get('/api/baseFrame/example/auth', auth.requiresLogin, function (req, res, next) {
      res.send('Only authenticated users can access this');
    });

    app.get('/api/baseFrame/example/admin', auth.requiresAdmin, function (req, res, next) {
      res.send('Only users with Admin role can access this');
    });

    app.get('/api/baseFrame/example/render', function (req, res, next) {
      BaseFrame.render('index', {
        package: 'baseFrame'
      }, function (err, html) {
        //Rendering a view from the Package server/views
        res.send(html);
      });
    });
  };
})();
