'use strict';

/** Module to send data to the table on the UI.
*
* @module table
* @requires mongoose
* @requires lodash
**/

var mongoose = require('mongoose');

var _ = require('lodash');

module.exports = function (Expertise){
    /** Merge bug tags with user tags and call the given callback to handle them.
    *
    * @param {object} modelsTags - Each model that will be merged is a key in this object.
        Tags must be under the name of the model they are associated with.
    * @param {function} callback - The callback to handle the merged tags.
    * @param {object} callbackParams - The params to pass to the callback. If empty,
        it will have the merged tags under the property 'tags'.
    **/
    function mergeTags(modelsTags, callback, callbackParams = {}){
        callbackParams.tags = {};
        var index = 0;

        for(var model in modelsTags){
            var tags = modelsTags[model].tags || [];
            for(var tag of tags){
                if(!callbackParams.tags.hasOwnProperty(tag._id)){
                    tag.index = index;
                    tag.userCount = (tag.count || 0);
                    tag.bugCount = (tag.bugCount || 0);
                    tag.soCount = (tag.soCount || 0);
                    tag.commonCount = Math.min(tag.userCount, tag.bugCount);
                    index++;
                    callbackParams.tags[tag._id] = tag;
                } else {
                    let new_tag = callbackParams.tags[tag._id];
                    new_tag.userCount += (tag.count || 0);
                    new_tag.bugCount += (tag.bugCount || 0);
                    new_tag.soCount += (tag.soCount || 0);
                    new_tag.commonCount = Math.min(new_tag.userCount, new_tag.bugCount);
                }
            }
        }
        callback(callbackParams);
    }

    /** Calculate the cosine similarity based on the given bug and developer tags.
    *
    * @param {array} nodesJson - Array with each of the tags, with their respective
        counters (bug, user, common). If the tag is a JSON, it's parsed to Object
        inside the function.
    **/
    function cosineSimilarity(nodesJson){
        var num = 0;
        var sum_bug = 0;
        var sum_dev = 0;

        for(let i in nodesJson){
            var node = nodesJson[i];
            if(typeof(node) === 'string'){
                node = JSON.parse(node);
            }

            num += (node.bugCount * node.userCount) || 0;
            sum_bug += (node.bugCount * node.bugCount) || 0;
            sum_dev += (node.userCount * node.userCount) || 0;
        }

        var similarity = num/(Math.sqrt(sum_bug) * Math.sqrt(sum_dev));
        return similarity || 0;
    }

    /** Calculate the jaccard similarity based on the given bug and developer tags.
    *
    * @param {array} nodesJson - Array with each of the tags, with their respective
        counters (bug, user, common). If the tag is a JSON, it's parsed to Object
        inside the function.
    **/
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
            if(node.bugCount) {
                if(node.bugCount < 10){
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

    /** Calculate the SSA_Z similarity
    *
    * @param {Object} user - Questions and answers from a user on StackOverflow.
    * @param {array} issueTags - The tags in the bug
    **/
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

    /** Descending order for the given values. If they are the same, sorts based
    * on the usernames.
    *
    * @param {Number} value1 - The first value of the comparison
    * @param {Number} value2 - The second value of the comparison
    * @param {Number} username1 - The username related to the first value.
    * @param {Number} username2 - The username related to the second value.
    **/
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

    /** Callback to Array.sort. Sorts according to the jaccard similarity.
    *
    * @callback
    **/
    var sortJaccard = function (a, b){
        return sort(a.jaccard, b.jaccard, a._id.toLowerCase(), b._id.toLowerCase());
    }

    /** Callback to Array.sort. Sorts according to the cosine similarity.
    *
    * @callback
    **/
    var sortCosine = function (a, b){
        return sort(a.cosine, b.cosine, a._id.toLowerCase(), b._id.toLowerCase());
    }

    /** Callback to Array.sort. Sorts according to the SSA_Z similarity.
    *
    * @callback
    **/
    var sortSsaZ = function (a, b){
        return sort(a.ssaZScore, b.ssaZScore, a._id.toLowerCase(), b._id.toLowerCase());
    }

    return {
        /** Calculates all the similarity metrics (jaccard, cosine, SSA_Z)
        * for a user and a bug.
        *
        * @param {Object} req - Express request.
        * @param {Object} res - Express response.
        * @param {Number} req.params.issueId - The GitHubIssue id. This is necessary
            to filter all the candidate assignees.
        * @returns {Object} Sends a response (using res.send) with an Object
            containing the similarities of this issue.
        **/
        findMatches: function (req, res) {
            var similarities = [];
            var Developer = mongoose.model('Developer');

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
                similarities.push(user);
            }

            function findSimilarities(users, issue){
                var params = {
                    Issue: {
                        tags: issue.bug.tags,
                    },
                }
                var tag_array = issue.bug.tags.map(function (tag){
                    return tag._id;
                });

                for(var user of users){
                    var callbackParams = {
                        user: { id: user.email },
                        issueTags: tag_array,
                    };

                    params.Developer = { tags: user.tags };
                    callbackParams.user.questions = user.questions;
                    callbackParams.user.answers = user.answers;

                    mergeTags(params, mergeCallback, callbackParams);
                }

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
                });
            }

            function findStackOverflowMatches(emails, issue){
                var SoProfile = mongoose.model('StackOverflowProfile');
                var filter = {
                    email: {
                        $in: emails,
                    },
                }

                SoProfile.find({email: {$in: emails}})
                .lean().exec(function (err, devs) {
                    findSimilarities(devs, issue);
                });
            }

            var issueCallback = function (issue){
                var filter = {
                    'repositories': issue.project,
                };
                var GitHubProfile = mongoose.model('GitHubProfile');

                GitHubProfile.find(filter).select('email').lean()
                  .exec(function (err, ghUsers){
                    if(err){
                        console.log(err);
                    } else {
                        var emails = ghUsers.map(function (user) {
                            return user.email;
                        });
                        findStackOverflowMatches(emails, issue);
                    }
                });
            }

            var GitHubIssue = mongoose.model('GitHubIssue');
            GitHubIssue.findOne({_id: req.params.issueId}).populate('bug')
              .lean().exec(function (err, issue){
                if(err){
                    console.log(err);
                    return null;
                }
                issueCallback(issue);
            });
        },
    }
}
