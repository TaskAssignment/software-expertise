'use strict';

var mongoose = require('mongoose');
var Issue = mongoose.model('Issue');
var SoUser = mongoose.model('SoUser');

/** This will provide the data for the graph */

module.exports = function (BaseFrame){


    /** Gets the coOccurrences from a list of tags
    *
    * @param req - Express request.
    * @param res - Express response.
    */
    coOccurrence: function (req, res) {
        var tags = req.query.tags.split(',');
        tags = tags.slice(0, -1); //Remove the last empty string

        var conditions = {
            $and:
              [{source: {$in: tags}} ,
              {target: {$in: tags}} ]
        }

        CoOccurrence.find(conditions, function(err, occurrences){
            res.json(occurrences);
        });
    }

    /**
    * This will format the tags and links to what is expected to render the graph
    *
    * @param links - Array of objects with source, target and coOccurrence
    * @param allTags - Object where key is tagName
    *
    * @return graph - Object with links and nodes.
    */
    function formatDataToGraph(links, allTags){
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

        return graph;
    }

    /**
    * This function will merge the tagsFromIssue with the tagsFromUserOnSO
    * Both tagsFromIssue and tagsFromUserOnSO have the format: name: count
    *
    * @return Object of objects with tag name being the main key
    and origin, index, issueCount, userCount and soCount as subkeys.
    */
    function mergeTags(){
        var allTags = {};
        var index = 0;

        var BOTH = 1;
        var ISSUE = 2;
        var USER = 3;
        for(var i in tagsFromIssue){
            var tag = tagsFromIssue[i];
            allTags[tag._id] = {
                name: tag._id,
                origin: ISSUE,
                index: index,
                issueCount: tag.issueCount,
                soCount: tag.soCount,
                userCount: 0,
            }
            index++;
        }

        for(var i in tagsFromUserOnSO){
            var tag = tagsFromUserOnSO[i];
            if(allTags[tag._id] === undefined) {
                allTags[tag._id] = {
                    name: tag._id,
                    origin: USER,
                    index: index,
                    userCount: tag.count,
                    issueCount: 0,
                    soCount: 0
                }
                index++;
            }else{
                allTags[tag._id].origin = BOTH;
                allTags[tag._id].userCount = tag.count;
            }
        }

        return allTags;
    }

    return {
        getDataForGraph: function(req, res){
            var issueId = req.query.issueId;
            var userId = req.query.userId;
        }
    }
}
