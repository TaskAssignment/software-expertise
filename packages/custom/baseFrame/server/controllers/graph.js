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
            for(var tag of modelsTags[model].tags){
                if(callbackParams.tags[tag._id] === undefined){
                    tag.index = index;
                    tag.userCount = tag.count || 0;
                    tag.issueCount = tag.issueCount || 0;
                    tag.soCount = tag.soCount || 0;
                    index++;
                } else {
                    tag.userCount += tag.count || 0;
                    tag.issueCount += tag.issueCount || 0;
                    tag.soCount += tag.soCount || 0;
                }

                callbackParams.tags[tag._id] = tag;
            }
        }

        callback(callbackParams);
    }

    /** Fetches user tags from database.
    */

    function findOneModel(Model, id, callback, callbackParams = {}){
        Model.findOne({_id: id}, 'tags', {lean: true}, function (err, model){
            if(err){
                console.log(err);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }
            callbackParams[Model.modelName] = model || {tags: []};
            callback(callbackParams);
        })
    }

    function cosineSimilarity(nodesJson){
        var num = 0;
        var sum_bug = 0;
        var sum_dev = 0;

        for(let nodeJson of nodesJson){
            var node = JSON.parse(nodeJson);

            num += (node.issueCount * node.userCount);
            sum_bug += (node.issueCount * node.issueCount);
            sum_dev += (node.userCount * node.userCount);
        }

        var similarity = num/(Math.sqrt(sum_bug) * Math.sqrt(sum_dev));

        return similarity
    }

    function jaccardSimilarity(nodesJson){
        var numerator = 0;
        var denominator = 0;
        for(let nodeJson of nodesJson){
            var node = JSON.parse(nodeJson);

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
                res.send(params);
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
            console.log(req.query);
            res.sendStatus(200);
        }
    }
}
