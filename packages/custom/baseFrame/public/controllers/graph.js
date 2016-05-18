'use strict';
/**
 * Class that handles drawing of the expertise graph
 */

function ExpertiseGraph() {

    var expertGraph = this;

    expertGraph.drawWithNewData = function(tagsFromIssue = {}, tagsFromUserOnSO = {}, $http){
        var allTags = mergeTags();

        var dataString = 'tags=';
        for(var tag in allTags){
            dataString += tag + ',';
        }
        showLoadingScreen();

        //TODO: Change this to a GET request!!!!
        $http({
            method: 'POST',
            url: '/api/baseFrame/coOccurrence',
            data: dataString,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (links) {
            drawGraph(links, allTags);
            hideLoadingScreen();
        });

        function drawGraph(links, allTags){
            var width = $('#expertiseGraph').innerWidth();
            var height = $('#leftSelectionPanel').innerHeight();

            var force = d3.layout.force()
                .size([width, height])
                .charge(-400)
                .linkDistance(300)
                .on("tick", tick);

            var drag = force.drag()
                .on("dragstart", dragstart);

            d3.select('svg').remove(); //Remove old svg before adding a new one.

            var svg = d3.select('#expertiseGraph').append('svg')
                .attr('width', width)
                .attr('height', height);

            var link = svg.selectAll(".link");
            var node = svg.selectAll(".node");

            /* In order to draw the graph, force must receive an ARRAY of nodes.
            * Each node must have at least a name.
            *
            * You must also pass an ARRAY of links. Each link must have a source
            * and a target, both are INDEXES of a node.
            */
            var graph = formatDataToGraph(links, allTags);

            force
                .nodes(graph.nodes)
                .links(graph.links)
                .start();

            link = link.data(graph.links)
                .enter().append("line")
                .attr("class", "link");

            /* Force graphs don't accept a circle with any other data, like a label.
            * To show any other information, a 'g' tag is necessary (group)
            */
            node = svg.selectAll('.node')
                .data(graph.nodes)
                .enter().append('g')
                .attr('class', 'node')
                .on("dblclick", dblclick)
                .call(drag);

            node.append("circle")
                .attr('r', function(d) {
                    return calculateCircleRatio(d.soCount);
                })
                .style('fill', function(d) { return d.origin; });

            node.append('text')
               .attr('dx', 12)
               .text(function(d) { return d.name });

            function tick() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr('transform', function(d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
            }

            function dblclick(d) {
                d3.select(this).classed("fixed", d.fixed = false);
            }

            function dragstart(d) {
                d3.select(this).classed("fixed", d.fixed = true);
            }
        }

        function calculateCircleRatio(counter){
            var sqrt = Math.sqrt(counter);
            var result = 0;
            if(sqrt != 0){
                result = 1/sqrt;
            }
            var MAX_RATIO = 10; //Add max ratio because 1 is too small to see
            return result * MAX_RATIO;
        }

        /**
        * This will format the tags and links to what is expected to render the graph
        *
        * @param links - Array of dicts with source, target and coOccurrence
        * @param allTags - Dict where key is tagName
        *
        * @return graph - Dict with links and nodes.
        */
        function formatDataToGraph(links, allTags){
            var graph = {};
            var new_links = []
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
                nodes[allTags[tag].index] = {
                    name: tag,
                    origin: allTags[tag].origin,
                    issueCount: allTags[tag].issueCount,
                    soCount: allTags[tag].soCount
                };
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
        * @return Dict of dicts with tag name being the main key
        and origin, index, issueCount and soCount as subkeys.
        */
        function mergeTags(){
            var allTags = {};
            var index = 0;

            var SO = 'blue';
            var ISSUE = 'yellow';
            var BOTH = 'red';
            for(var tag in tagsFromIssue){
                allTags[tag] = {
                    origin: ISSUE,
                    index: index,
                    issueCount: parseInt(tagsFromIssue[tag].issueCount),
                    soCount: parseInt(tagsFromIssue[tag].soCount),
                }
                index++;
            }

            for(var tag in tagsFromUserOnSO){
                if(allTags[tag] === undefined) {
                    allTags[tag] = {
                        origin: SO,
                        index: index,
                        soCount: parseInt(tagsFromUserOnSO[tag]),
                        issueCount: 0
                    }
                    index++;
                }else{
                    allTags[tag].origin = BOTH;
                    allTags[tag].soCount += parseInt(tagsFromUserOnSO[tag]);
                }
            }

            return allTags;
        }
    }
}
