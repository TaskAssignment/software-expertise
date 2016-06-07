'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');
var CoOccurrence = mongoose.model('CoOccurrence');
var Developer = mongoose.model('Developer');

/** This will provide the data for the graph **/

module.exports = function (BaseFrame){
    // TODO: REMAKE THIS DOCUMENTATION!!!
    /**
    * This will format the tags and links to what is expected to render the graph
    *
    **/
    function formatDataToGraph(links, allTags, callback, callbackParams = {}){
        for(var link of links){
            // Adds the values of these occurences to the tags counter
            allTags[link.source].soCount += (link.occurrences || 0);
            allTags[link.target].soCount += (link.occurrences || 0);

            link.source = allTags[link.source].index;
            link.target = allTags[link.target].index;
        }

        var nodes = [];
        for(var tag in allTags){
            nodes[allTags[tag].index] = allTags[tag];
        }

        callbackParams.nodes = nodes;
        callbackParams.links = links;

        callback(callbackParams);

    }

    /**
    * This function will merge the issueTags with the userTags
    * Both issueTags and userTags have _id, count[, soCount].
    **/
    function mergeTags(modelsTags, callback, callbackParams = {}){
        callbackParams.tags = {};
        var index = 0;

        for(var model in modelsTags){
            var tags = modelsTags[model].tags || [];
            for(var tag of tags){
                if(callbackParams.tags[tag._id] === undefined){
                    tag.index = index;
                    tag.userCount = (tag.count || 0);
                    tag.issueCount = (tag.issueCount || 0);
                    tag.soCount = (tag.soCount || 0);
                    tag.commonCount = Math.min(tag.userCount, tag.issueCount);
                    index++;
                    callbackParams.tags[tag._id] = tag;
                } else {
                    let new_tag = callbackParams.tags[tag._id];
                    new_tag.userCount += (tag.count || 0);
                    new_tag.issueCount += (tag.issueCount || 0);
                    new_tag.soCount += (tag.soCount || 0);
                    new_tag.commonCount = Math.min(new_tag.userCount, new_tag.issueCount);
                }
            }
        }

        callback(callbackParams);
    }

    /** Fetches user tags from database.
    **/

    function findOneModel(Model, id, callback, callbackParams = {}, selectItems = 'tags'){
        Model.findOne({_id: id}, selectItems, {lean: true}, function (err, model){
            if(err){
                console.log(err);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }
            callbackParams[Model.modelName] = model || {tags: []};
            callback(callbackParams);
        });
    }

    function findModel(Model, filter, callback, callbackParams = {}, selectItems = 'tags'){
        Model.find(filter, selectItems, {lean: true}, function (err, models){
            if(err){
                console.log(err);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }
            callbackParams[Model.modelName] = models;
            callback(callbackParams);
        });
    }

    function cosineSimilarity(nodesJson){
        var num = 0;
        var sum_bug = 0;
        var sum_dev = 0;

        for(let i in nodesJson){
            var node = nodesJson[i];
            if(typeof(node) === 'string'){
                var node = JSON.parse(node);
            }


            num += (node.issueCount * node.userCount) || 0;
            sum_bug += (node.issueCount * node.issueCount) || 0;
            sum_dev += (node.userCount * node.userCount) || 0;
        }

        var similarity = num/(Math.sqrt(sum_bug) * Math.sqrt(sum_dev));
        return similarity || 0;
    }

    function jaccardSimilarity(nodesJson){
        var numerator = 0;
        var denominator = 0;
        for(let i in nodesJson){
            var node = nodesJson[i];
            if(typeof(node) === 'string'){
                var node = JSON.parse(node);
            }

            var issueWeight = 0;
            var userWeight = 0;
            if(node.issueCount) {
                if(node.issueCount < 10){
                    issueWeight = 1;
                } else {
                    issueWeight = 1/Math.log10(node.soCount);
                }
            }

            if(node.userCount){
                if(node.userCount < 10){
                    userWeight = 1;
                } else {
                    userWeight = 1/Math.log10(node.soCount);
                }
            }

            numerator += Math.min(issueWeight, userWeight);
            denominator += issueWeight;
        }

        if(denominator == 0){
            return 0;
        }

        return numerator/denominator;
    }

    function ssaZSimilarity(user, issueTags){
        var _ = require('lodash');

        var aScore = 0;
        var qScore = 0;

        for(var answer of user.answers){
            let matchTagsA = _.intersection(answer.tags, issueTags);
            aScore += ((answer.score + 1) * matchTagsA.length);
        }

        for(var question of user.questions){
            let matchTagsQ = _.intersection(question.tags, issueTags);
            let den = (question.score + 1) || 1;
            qScore += (matchTagsQ.length/den);
        }

        var MU = 1;
        qScore *= MU;

        let numerator = aScore - qScore;
        let denominator = Math.sqrt(aScore + qScore) || 1; //Avoid division by 0

        return numerator/denominator;
    }

    return {
        /** Gets and formats the graph data.
        *
        * @param req - Express request.
        * @param res - Express response.
        * @param req.params.modeIssue - The mode to look for issues. For now, just using 'default' (issue text from github).
        * @param req.params.modeUser - The mode to look for user. For now, just using 'default' (user data from SO).
        * @param req.query.issueId - The issueId when the mode is default. It will look for this issue in the local database.
        * @param req.query.userId - The userId when the mode is default. It will look for this user in the local database.
        **/
        getDataForGraph: function(req, res){
            //For now I'll treat all the requests as default ones.
            var ids = req.query;

            var formatCallback = function (params){
                if(!res.headersSent){
                    res.send(params);
                }
            };

            var mergeCallback = function (params){
                var tags = Object.keys(params.tags);

                var conditions = {
                    $and: [
                        {source: {$in: tags}} ,
                        {target: {$in: tags}}
                    ]
                };

                CoOccurrence.find(conditions, '-_id occurrences source target', {lean: true}, function(err, occurrences){
                    formatDataToGraph(occurrences, params.tags, formatCallback);
                });
            };

            var userCallback = function (params){
                if(params.Developer.soProfile){
                    params.Developer = {
                        tags: params.Developer.soProfile.tags
                    }
                }
                mergeTags(params, mergeCallback);
            };

            var issueCallback = function(params){
                findOneModel(Developer, ids.userId, userCallback, params, 'soProfile');
            };

            findOneModel(Issue, ids.issueId, issueCallback);
        },

        calculateSimilarity: function(req, res){
            var mode = req.params.similarity;
            var response = {
                similarity: 'No similarity',
                args: mode
            };

            switch (mode) {
                case 'jaccard':
                    response.similarity = jaccardSimilarity(req.query.nodes);
                    break;
                default:
                    response.similarity = cosineSimilarity(req.query.nodes);
            }

            res.json(response);
        },

        findMatches: function (req, res) {

            var similarities = [];
            var assignee = undefined;

            var mergeCallback = function (params){
                var user = {};

                user.username = params.user.id;
                user.jaccard = jaccardSimilarity(params.tags);
                user.cosine = cosineSimilarity(params.tags);
                user.ssaZScore = ssaZSimilarity(params.user, params.issueTags);

                if(params.assignee == user.username){
                    user.assignee = true;
                    assignee = user;
                } else {
                    user.assignee = false;
                }

                similarities.push(user);
            }

            var issueCallback = function (params){
                var filter = {
                    $or: [
                        {
                            'ghProfile.repositories': params.Issue.projectId,
                            soProfile: { $exists: true }
                        },{
                            _id: params.Issue.assigneeId
                        }
                    ]
                };

                var tag_array = params.Issue.tags.map(function (tag){
                    return tag._id;
                })

                Developer.find(filter, 'soProfile', {lean: true}, function (err, users){
                    for(var user of users){
                        var callbackParams = {
                            user: { id: user._id },
                            assignee: params.Issue.assigneeId,
                            issueTags: tag_array
                        };

                        if(user.soProfile){
                            params.Developer = {tags: user.soProfile.tags};
                            callbackParams.user.questions = user.soProfile.questions;
                            callbackParams.user.answers = user.soProfile.answers;
                        } else {
                            params.Developer = {tags: []};
                        }

                        mergeTags(params, mergeCallback, callbackParams);
                    }

                    function sort(value1, value2, username1, username2){
                        if(value1 == value2){
                            if(username1 <  username2)
                                return -1;
                            else{
                                return 1;
                            }
                        }
                        //Desc order!
                        return value2 - value1;
                    }

                    //Sort jaccard desc order.
                    var sortJaccard = function (a, b){
                        return sort(a.jaccard, b.jaccard, a.username.toLowerCase(), b.username.toLowerCase());
                    }
                    //Sort cosine desc order.
                    var sortCosine = function (a, b){
                        return sort(a.cosine, b.cosine, a.username.toLowerCase(), b.username.toLowerCase());
                    }
                    //Sort ssaZ desc order.
                    var sortSsaZ = function (a, b){
                        return sort(a.ssaZScore, b.ssaZScore, a.username.toLowerCase(), b.username.toLowerCase());
                    }

                    var findAssignee = function (element, index, array){
                        return element.assignee;
                    }

                    var position = {};

                    similarities.sort(sortCosine);
                    position.cosine = similarities.findIndex(findAssignee);

                    similarities.sort(sortJaccard);
                    position.jaccard = similarities.findIndex(findAssignee);

                    similarities.sort(sortSsaZ);
                    position.ssaZ = similarities.findIndex(findAssignee);

                    res.json({
                        similarities: similarities,
                        assigneePosition: position
                    });
                });

            }

            findOneModel(Issue, req.params.issueId, issueCallback, {}, 'tags projectId assigneeId');

        },

        findMatchAverage: function (req, res) {
            //
            // var similarities = [];
            // var positions = [];
            //
            // var mergeCallback = function (params){
            //     var user = {};
            //
            //     user.username = params.user.id;
            //     user.jaccard = jaccardSimilarity(params.tags);
            //     user.cosine = cosineSimilarity(params.tags);
            //     user.ssaZScore = ssaZSimilarity(params.user, params.issueTags);
            //
            //     if(params.assignee == user.username){
            //         user.assignee = true;
            //     } else {
            //         user.assignee = false;
            //     }
            //
            //     similarities.push(user);
            // }
            //

            //
            // var tag_array = params.Issue.tags.map(function (tag){
            //     return tag._id;
            // })
            //
            // Developer.find(filter, 'soProfile', {lean: true}, function (err, users){

            //
            //         mergeTags(params, mergeCallback, callbackParams);
            //     }
            // });

            var positions = [];
            var devCallback = function(params){
                console.log(params.issues.length);
                console.log(params.Developer.length);
                for(var issue of params.issues){
                    for(var user of params.Developer){
                        var callbackParams = {
                            user: { id: user._id },
                            assignee: issue.assigneeId
                            // issueTags: tag_array
                        };

                        if(user.soProfile){
                            callbackParams.Developer = {tags: user.soProfile.tags};
                            callbackParams.user.questions = user.soProfile.questions;
                            callbackParams.user.answers = user.soProfile.answers;
                        } else {
                            callbackParams.Developer = {tags: []};
                        }
                        positions.push(1);
                    }
                }
                console.log(positions.length);
            }


            var issuesCallback = function(params){
                var filter = {
                    $or: [
                        {
                            'ghProfile.repositories': req.params.projectId,
                            soProfile: { $exists: true }
                        },{
                            _id: params.Issue.assigneeId
                        }
                    ]
                };

                var callbackParams = {
                    issues: params.Issue
                };

                findModel(Developer, filter, devCallback, callbackParams, 'soProfile');
            }

            var filter = {
                projectId: req.params.projectId,
                pull_request: false,
                parsed: true,
                assigneeId: {$exists: true}
            };

            findModel(Issue, filter, issuesCallback, {}, 'tags assigneeId');
            res.send({});
            // var issueCallback = function (params){
            //
            //
            //         function sort(value1, value2, username1, username2){
            //             if(value1 == value2){
            //                 if(username1 <  username2)
            //                     return -1;
            //                 else{
            //                     return 1;
            //                 }
            //             }
            //             //Desc order!
            //             return value2 - value1;
            //         }
            //
            //         //Sort jaccard desc order.
            //         var sortJaccard = function (a, b){
            //             return sort(a.jaccard, b.jaccard, a.username.toLowerCase(), b.username.toLowerCase());
            //         }
            //         //Sort cosine desc order.
            //         var sortCosine = function (a, b){
            //             return sort(a.cosine, b.cosine, a.username.toLowerCase(), b.username.toLowerCase());
            //         }
            //         //Sort ssaZ desc order.
            //         var sortSsaZ = function (a, b){
            //             return sort(a.ssaZScore, b.ssaZScore, a.username.toLowerCase(), b.username.toLowerCase());
            //         }
            //
            //         var findAssignee = function (element, index, array){
            //             return element.assignee;
            //         }
            //
            //         var position = {};
            //
            //         similarities.sort(sortCosine);
            //         position.cosine = similarities.findIndex(findAssignee);
            //
            //         similarities.sort(sortJaccard);
            //         position.jaccard = similarities.findIndex(findAssignee);
            //
            //         similarities.sort(sortSsaZ);
            //         position.ssaZ = similarities.findIndex(findAssignee);
            //
            //         positions.push(position);
            //
            // }

        }
    }
}
