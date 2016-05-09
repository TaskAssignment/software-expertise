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

          //temporary numbers just to see how things work
          var width = 800; //window.innerWidth - d3.select('#leftSelectionPanel').node().getBoundingClientRect().width - 5;
          var height = 800; //window.innerHeight - d3.select('.page-header').node().getBoundingClientRect().height - 5;

          var color = d3.scale.category20();

          var force = d3.layout.force()
              .charge(-120)
              .linkDistance(300)
              .size([width, height]);

          d3.select('svg').remove(); //Remove old svg before adding a new one.

          var svg = d3.select('#expertiseGraphDiv').append('svg')
              .attr('width', width)
              .attr('height', height);

          //Move this to a function once it's woking

          var graph = formatDataToGraph(links, allTags);

          /* In order to draw the graph, force must receive an ARRAY of nodes.
          * Each node must have at least a name.
          *
          * You must also pass an ARRAY of links.
          * Each link must have a source and a target, both are INDEXES of a node
          * (don't use the name, it took me a really long time to figure that out)
          */
          force.nodes(graph.nodes)
              .links(graph.links)
              .start();

          var link = svg.selectAll('.link')
              .data(graph.links)
            .enter().append('line')
              .attr('class', 'link')
              .style('stroke-width', function(d) { return Math.sqrt(d.weight); });

          /*
          * force graphs don't accept a circle with any other data, like a label.
          * To show any other information, a 'g' tag is necessary (group)
          */
          var node = svg.selectAll('.node')
              .data(graph.nodes)
              .enter().append('g')
                .attr('class', 'node')
                .call(force.drag);



          var circle = node.append('circle')
              .attr('r', function(d) { return calculateCircleRatio(d.issueCount); })
              .style('fill', function(d) { return d.origin; });

          var circle = node.append('circle')
              .attr('r', function(d) { return calculateCircleRatio(d.soCount); })
              .style('fill', function(d) { return d.origin; });

          /*
          * Add onClick behavior. In this case, simply changes the circle ratio
          * Soon I'll show information of the node on click
          */
          // circle.on('click', function(){
          //     var circle = d3.select(this);
          //     var ratio = circle.attr('r');
          //     if(ratio >= 20){
          //         ratio = 5;
          //     } else {
          //         ratio *= 2;
          //     }
          //     circle.attr('r', function(d) { return d.count });
          // });

          node.append('text')
            .attr('dx', 12)
            .text(function(d) { return d.name });


          force.on('tick', function() {
              link.attr('x1', function(d) { return d.source.x; })
                  .attr('y1', function(d) { return d.source.y; })
                  .attr('x2', function(d) { return d.target.x; })
                  .attr('y2', function(d) { return d.target.y; });

              node.attr('transform', function(d) {
                  return 'translate(' + d.x + ',' + d.y + ')';
              });
          });

        }

        function calculateCircleRatio(counter){
            var MAX_RATIO = 20;
            var MIN_RATIO = 5;
            var result = counter/MAX_RATIO + MIN_RATIO;
            return result > MAX_RATIO ? MAX_RATIO : result;
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
                    value: occurrence.occurrences
                };

                new_links.push(link);

                // Adds the values of these occurences to the tags counter
                allTags[occurrence.source].soCount += (link.value || 0);
                allTags[occurrence.target].soCount += (link.value || 0);
            }

            /* The graph needs an array and the indexes in links will be this array
            * indexes. That's why I created this like that, instead of pushing to
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
                    issueCount: tagsFromIssue[tag],
                    soCount: 0,
                }
                index++;
            }

            for(var tag in tagsFromUserOnSO){
                if(allTags[tag] === undefined) {
                    allTags[tag] = {
                        origin: SO,
                        index: index,
                        soCount: tagsFromUserOnSO[tag],
                        issueCount: 0
                    }
                    index++;
                }else{
                    allTags[tag].origin = BOTH;
                    allTags[tag].soCount += tagsFromUserOnSO[tag];
                }
            }

            return allTags;
        }
    }
}
