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
    * @param links - Array of objects with source, target and coOccurrence
    * @param allTags - Object where keys are the tag names
    *
    * @return graph - Object with links and nodes.
    */
    function formatDataToGraph(links, allTags, res){
        var graph = {};
        var new_links = [];
        for(var i = 0; i < links.length; i++){
            var occurrence = links[i];
            var link = {
                source: allTags[occurrence.source].index,
                target: allTags[occurrence.target].index,
                value: parseInt(occurrence.occurrences)
            };
            new_links.push(link);

            // Adds the values of these occurences to the tags counter
            allTags[occurrence.source].soCount += (link.value || 0);
            allTags[occurrence.target].soCount += (link.value || 0);
        }

        /* The links reference to array indexes.
        * That's why I created this like that, instead of pushing to
        * the array's last position.
        */
        var length = allTags.length || 0;
        var nodes = new Array(length);
        for(var tag in allTags){
            nodes[allTags[tag].index] = allTags[tag];
        }

        var graph = {
            nodes: nodes,
            links: new_links
        }

        res.send(graph);
    }

    /**
    * This function will merge the issueTags with the userTags
    * Both issueTags and userTags have _id, count[, soCount].
    *
    * @param userTags - Tags from user on StackOverflow
    * @param issueTags - Issue text converted into SO tags.
    * @param res - Express response
    * @return Object of objects with tag name being the main key
    and origin, index, issueCount, userCount and soCount as subkeys.
    */
    function mergeTags(userTags, issueTags, res){
        var allTags = {};
        var index = 0;

        for(var i in issueTags){
            var tag = issueTags[i];
            allTags[tag._id] = {
                name: tag._id,
                index: index,
                issueCount: tag.issueCount,
                soCount: tag.soCount,
                userCount: 0,
            }
            index++;
        }

        for(var i in userTags){
            var tag = userTags[i];
            if(allTags[tag._id] === undefined) {
                allTags[tag._id] = {
                    name: tag._id,
                    index: index,
                    userCount: tag.count,
                    issueCount: 0,
                    soCount: 0
                }
                index++;
            }else{
                allTags[tag._id].userCount = tag.count;
            }
        }

        var tags = Object.keys(allTags);

        var conditions = {
            $and: [
                {source: {$in: tags}} ,
                {target: {$in: tags}}
            ]
        };

        CoOccurrence.find(conditions, '-_id occurrences source target', {lean: true}, function(err, occurrences){
            formatDataToGraph(occurrences, allTags, res);
        });
    }

    /** Fetches user tags from database.
    *
    * @param userId - user to have its tags retrieved.
    * @param res - Express response.
    * @param issueTags - Issue text converted into SO tags. This is only needed to call the next function.
    */

    function findUserTags(userId, res, issueTags = []){
        SoUser.findOne({_id: userId}, 'tags', {lean: true}, function (err, user){
            if(err){
                console.log(err);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }

            if(user){
                mergeTags(user.tags, issueTags, res);
            } else {
                mergeTags([], issueTags, res);
            }
        })
    }

    /** Fetches issue tags from database. Sends the tags and userId to findUserTags
    *
    * @param ids - Dict with userId and issueId. The userId will call the next function.
    * @param res - Express response.
    */
    function findIssueTags(ids, res){
        Issue.findOne({_id: ids.issueId}, 'tags', {lean: true}, function (err, issue){
            if(err){
                console.log(err);
                if(!res.headersSent){
                    res.sendStatus(500);
                }
            }

            if(issue){
                findUserTags(ids.userId, res, issue.tags);
            } else {
                findUserTags(ids.userId, res);
            }
        })
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
            findIssueTags(req.query, res);
        },

        calculateSimilarity: function(req, res){
            var response = {
                similarity: 'No similarity',
                args: 'no method'
            };

            if(req.params.similarity == 'cosine'){
                var num = 0;
                var sum_bug = 0;
                var sum_dev = 0;

                for(let nodeJson of req.query.nodes){
                    var node = JSON.parse(nodeJson);

                    num += (node.issueCount * node.userCount);
                    sum_bug += (node.issueCount * node.issueCount);
                    sum_dev += (node.userCount * node.userCount);
                }

                var similarity = num/(Math.sqrt(sum_bug) * Math.sqrt(sum_dev));

                response.similarity = similarity;
                response.args = 'cosine';

            }

            res.json(response);
        }
    }
}
