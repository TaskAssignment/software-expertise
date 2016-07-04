'use strict';

var mongoose = require('mongoose');
var Bug = mongoose.model('Bug');
var CoOccurrence = mongoose.model('CoOccurrence');
var Developer = mongoose.model('Developer');

var _ = require('lodash');

/** This will provide the data for the graph **/

module.exports = function (BaseFrame){
    // TODO: REMAKE THIS DOCUMENTATION!!!

    /**
    * This function will merge the issueTags with the userTags
    * Both issueTags and userTags have _id, count, soCount.
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

    function findOneModel(Model, id, callback, callbackParams = {}, selectItems = 'tags'){
        Model.findOne({_id: id}, selectItems, {lean: true}, function (err, model){
            if(err){
                console.log(err);
            }
            callbackParams[Model.modelName] = model || {tags: []};
            callback(callbackParams);
        });
    }

    function findModel(Model, filter, callback, callbackParams = {}, selectItems = 'tags'){
        Model.find(filter, selectItems, {lean: true}, function (err, models){
            if(err){
                console.log(err);
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
                node = JSON.parse(node);
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
                node = JSON.parse(node);
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

        if(denominator === 0){
            return 0;
        }

        return numerator/denominator;
    }

    function ssaZSimilarity(user, issueTags){
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

    function sort(value1, value2, username1, username2){
        if(value1 === value2){
            if(username1 <  username2){
                return -1;
            }else{
                return 1;
            }
        }
        //Desc order!
        return value2 - value1;
    }

    //Sort jaccard desc order.
    var sortJaccard = function (a, b){
        return sort(a.jaccard, b.jaccard, a._id.toLowerCase(), b._id.toLowerCase());
    }

    //Sort cosine desc order.
    var sortCosine = function (a, b){
        return sort(a.cosine, b.cosine, a._id.toLowerCase(), b._id.toLowerCase());
    }

    // Sort ssaZ desc order.
    var sortSsaZ = function (a, b){
        return sort(a.ssaZScore, b.ssaZScore, a._id.toLowerCase(), b._id.toLowerCase());
    }

    var findAssignee = function (element, index, array){
        return element.assignee;
    }

    return {
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

            var mergeCallback = function (params){
                var user = {};

                user._id = params.user.id;
                user.jaccard = jaccardSimilarity(params.tags);
                user.cosine = cosineSimilarity(params.tags);
                user.ssaZScore = ssaZSimilarity(params.user, params.issueTags);
                user.repos = params.user.repos;
                user.tags = [];
                for(var key in params.tags){
                    var tag = params.tags[key];
                    if(tag.userCount > 0) {
                        user.tags.push(tag._id);
                    }
                }
                user.amountQuestions = params.user.questions.length;
                user.amountAnswers = params.user.answers.length;

                if(params.assignee === params.user.id){
                    user.assignee = true;
                } else {
                    user.assignee = false;
                }
                similarities.push(user);
            }

            var issueCallback = function (params){
                var filter = {
                    'profiles.gh.repositories': params.Bug.projectId,
                };

                var tag_array = params.Bug.tags.map(function (tag){
                    return tag._id;
                })

                var selectItems = 'profiles.so profiles.gh'
                Developer.find(filter, selectItems )
                .populate('profiles.so profiels.gh').exec(function (err, users) {
                    console.log(users);
                    for(var user of users){
                        var callbackParams = {
                            user: { id: user._id },
                            assignee: params.Bug.assigneeId,
                            issueTags: tag_array
                        };
                        callbackParams.user.repos = [];

                        for(var repo of user.ghProfile.repositories){
                            callbackParams.user.repos.push(repo.name);
                        }

                        if(user.soProfile){
                            params.Developer = {tags: user.soProfile.tags};
                            callbackParams.user.questions = user.soProfile.questions;
                            callbackParams.user.answers = user.soProfile.answers;
                        } else {
                            callbackParams.user.questions = [];
                            callbackParams.user.answers = [];
                            params.Developer = {tags: []};
                        }

                        mergeTags(params, mergeCallback, callbackParams);
                    }

                    var position = {};

                    similarities.sort(sortCosine);
                    for(var i = 0; i < similarities.length; i++){
                        var user = similarities[i];
                        user.cosineIndex = i + 1;
                    }

                    similarities.sort(sortJaccard);
                    for(var i = 0; i < similarities.length; i++){
                        var user = similarities[i];
                        user.jaccardIndex = i + 1;
                    }

                    similarities.sort(sortSsaZ);
                    for(var i = 0; i < similarities.length; i++){
                        var user = similarities[i];
                        user.ssazIndex = i + 1;
                    }

                    res.json({
                        similarities: similarities,
                        assigneePosition: position
                    });
                });

            }

            findOneModel(Bug, req.params.bugId, issueCallback, {}, 'tags');
        },
    }
}
