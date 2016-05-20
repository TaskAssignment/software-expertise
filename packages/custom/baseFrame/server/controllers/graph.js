'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');
var SoUser = mongoose.model('SoUser');
var CoOccurrence = mongoose.model('CoOccurrence');

/** This will provide the data for the graph */

module.exports = function (BaseFrame){

    /**
    * This will format the tags and links to what is expected to render the graph
    *
    */
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
    */
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
                    index++;
                    callbackParams.tags[tag._id] = tag;
                } else {
                    let new_tag = callbackParams.tags[tag._id];
                    new_tag.userCount += (tag.count || 0);
                    new_tag.issueCount += (tag.issueCount || 0);
                    new_tag.soCount += (tag.soCount || 0);
                    tag.index = callbackParams.tags[tag._id].index;
                }
            }
        }

        callback(callbackParams);
    }

    /** Fetches user tags from database.
    */

    function findOneModel(Model, id, callback, callbackParams = {}){
        Model.findOne({_id: id}, 'tags projectId', {lean: true}, function (err, model){
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
                issueWeight = 1/Math.sqrt(node.issueCount);
            }

            if(node.userCount){
                userWeight = 1/Math.sqrt(node.userCount);
            }

            numerator += Math.min(issueWeight, userWeight);
            denominator += issueWeight;
        }

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
        */
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
                mergeTags(params, mergeCallback);
            };

            var issueCallback = function(params){
                findOneModel(SoUser, ids.userId, userCallback, params);
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

            var similarities = {};

            var mergeCallback = function (params){
                var value = 0;
                switch (req.params.similarity) {
                    case 'jaccard':
                        value = jaccardSimilarity(params.tags);
                        break;
                    default:
                        value = cosineSimilarity(params.tags);
                }

                if(similarities[value]){
                    similarities[value].push(params.userId);
                } else {
                    similarities[value] = [params.userId];
                }
            }

            var issueCallback = function (params){
                SoUser.find({repositories: params.Issue.projectId}, 'tags', {lean: true}, function (err, users){

                    for(var user of users){
                        params.SoUser = user;
                        mergeTags(params, mergeCallback, {userId: user._id});
                    }

                    delete similarities[0];
                    res.json(similarities);
                });
            }

            findOneModel(Issue, req.params.issueId, issueCallback);

        }
    }
}
