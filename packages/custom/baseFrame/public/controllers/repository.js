'use strict';

function showLoadingScreen(){
    d3.select('#loadingImage').style('display','block');
}
function hideLoadingScreen(){
    d3.select('#loadingImage').style('display','none');
}

/**
 * @author dbsigurd - devon Sigurdson
 *  controller to handle all things related to the expertiseGraph
 *
 * @param '$scope', 'Global', 'BaseFrame', '$http', '$location'
 */
/* jshint -W098 */
angular.module('mean.baseFrame')
  .controller('RepositoryController',
  ['$scope', 'Global', 'BaseFrame', '$http', '$location',
  function ($scope, Global, BaseFrame, $http, $location) {

      /**
       * Updates the url based on the current state of the project
       */
        function updateDeeplink (){
            try {
                $location.search(optionsState);
            } catch (e) {
            }
        }

        /**
        * Add default configurations to this variable instead of doing an API
        * request everytime just to get this.
        */
        var optionsState = {
            'repoName' : undefined,
            'issueId' :  undefined,
            'userName' : undefined,
            'directed' : false,
            'soWeight' : 'log',
            'userWeight' : 'log',
            'bugWeight' : 'log',
            'showDirectChildren' : false
        };


        var graphs = new ExpertiseGraph(optionsState);

        var tagsFromIssue;
        var tagsFromUserOnSO;

        $scope.global = Global;
        /**
         *
         * Using the repoSearched retrieve all matching repos
         * displays them in a selector
         *
         */
        $scope.queryRepos = function () {
            var URL = 'https://api.github.com/search/repositories?q=';
            if($scope.repositoryName)
                URL += $scope.repositoryName + '+in:name';
            if($scope.repoDescription)
                URL += '+' + $scope.repoDescription + '+in:description';
            if($scope.repoReadme)
                URL += '+' + $scope.repoReadme + '+in:readme';
            if($scope.repoUser)
                URL += '+user:' + $scope.repoUser;
            URL += '&sort=stars&order=desc&per_page=100';

            $http.get(URL).success(function (response) {
                  var results = response.items;
                  // TODO: Figure out how to get next items

                  $('#repoSelection').removeClass('hidden')
                  $scope.repos = [];
                  for (var i = 0; i < results.length; i++) {
                      $scope.repos.push( results[i].full_name );
                  }
            });
        }

        $scope.populateSoTags = function(){
            populateRequest('/api/baseFrame/populateSoTags');
        }

        $scope.populateSoUsers = function(){
            populateRequest('/api/baseFrame/populateSoUsers');
        }

        $scope.populateCoOccurrences = function(){
          populateRequest('/api/baseFrame/populateCoOccurrences');
        }

        function populateRequest(url){
            showLoadingScreen();
            $http({
                method: 'POST',
                url: url,
                data: '',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (response){
                console.log("Success");
                hideLoadingScreen();
            });
        }



        /**
         *
         * Retrieve relevant information from selected repository
         * shows users and issues to end user
         * @param nameSelected
         *
         *
         */
        $scope.getRepoInformation = function (nameSelected) {
            getRepoContributors(nameSelected);
            getRepoIssues(nameSelected);
        }

        /**
        * Gets the contributors of the selected repository
        */
        function getRepoContributors(repo){
            optionsState.repoName =  repo;
            updateDeeplink();
            var contributorsURL = 'https://api.github.com/repos/' +
              repo +
              '/contributors';

            $http.get(contributorsURL).success(function (response) {
                var results = response;
                $('#repositoyInfoDisplay').removeClass('hidden')
                $('#repoSelection').addClass('hidden')

                $scope.users = [];
                for (var i = 0; i < results.length; i++) {
                    $scope.users.push( results[i].login );
                }
                $scope.repoName = repo;
            });
        }

        /**
        * Gets the github issues of the selected repository
        */
        function getRepoIssues(repo){
            var issuesURL = 'https://api.github.com/repos/' +
              repo +
              '/issues';
            $http.get(issuesURL).success(function (response) {
                var results = response;
                $('#userSelection').removeClass('hidden')

                $scope.issues = [];
                for (var i = 0; i < results.length; i++) {
                    var issue = {
                        id: results[i].id,
                        body: results[i].body,
                        title: results[i].title
                    }

                    $scope.issues.push(issue);
                }
            });
        }
        /**
         * displays the user portion of the expertise graph
         * I think this should be in a different file.
         *
         * @param user - github username
         */
        $scope.displayUserExpertise = function(user){
            optionsState.userName = user;
            updateDeeplink();

            getSOIDForUser(user);

            /**
            * Makes an http post request to get the users matching SO information
            *
            * @param userName - GitHub user name
            * @return soId - Stack Overflow id for the given username
            */
            function getSOIDForUser(userName){
                var apiCallUrl  = '/api/baseFrame/soIDFromUser'; //Not sure if this will work everytime
                $http({
                    method: 'POST',
                    url: apiCallUrl,
                    data: 'gitName=' + userName,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function (soId) {
                    if(soId){
                        getSOTagsFromUser(soId);
                    } else {
                        console.log('User is not on StackOverflow');
                        return 'User is not on StackOverflow';
                    }
                });
            }

            /**
            * Gets the Stack Overflow tags related to the given user.
            *
            * @param soId - StackOverflow Id
            */
            function getSOTagsFromUser(soId){
                var soURLStr = 'http://api.stackexchange.com/2.2/users/' +
                    soId + '/tags?pagesize=100&order=desc&sort=popular&site=stackoverflow&filter=!-.G.68phH_FJ'
                $http.get(soURLStr).success(function(soTags) {
                    tagsFromUserOnSO = {}
                    for(let tag of soTags.items){
                        tagsFromUserOnSO[tag.name] = tag.count;
                    }
                    sendToGraph();
                });
            }
        }
        /**
         * display information based on issues
         *
         * @param issue - Dictionary with id, title and body from github issue
         */
        $scope.getIssueTags = function (issue) {
            optionsState.issueId = issue.id;
            updateDeeplink();

            //Any word from the issue that is an SO tag will be in this array.
            //This is the array that is sent to '/api/baseFrame/coOccurrence'
            showLoadingScreen();
            $http({
                method: 'POST',
                url: '/api/baseFrame/getIssueTags',
                data: 'title=' + issue.title + '&body=' + issue.body,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (response) {
                hideLoadingScreen();
                tagsFromIssue = response;
                sendToGraph();
            });
        }

        function sendToGraph(){
            graphs.drawWithNewData(tagsFromIssue, tagsFromUserOnSO, $http, optionsState);
        }

        $scope.package = {
            name: 'baseFrame'
        };
    }
]);

/**
 * Class that handles drawing of the expertise graph
 *
 * @param initConfig - initial graph options
 *
 */

function ExpertiseGraph(initConfig) {

    var graphConfig = initConfig;
    var expertGraph = this;

    expertGraph.drawWithNewData = function(tagsFromIssue = {}, tagsFromUserOnSO = {}, $http, optionsState){
        graphConfig = optionsState;
        var allTags = mergeTags();

        var dataString='';
        for(var tag in allTags){
            dataString += 'tag=' + tag + '&';
        }
        showLoadingScreen();

        $http({
            method: 'GET',
            url: '/api/baseFrame/coOccurrence',
            data: dataString,
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
              .linkDistance(250)
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
        * @param links - Dict of dicts with Tag1, Tag2 and coOccurrence
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
                    source: allTags[occurrence.Tag1].index,
                    target: allTags[occurrence.Tag2].index,
                    value: occurrence.CoOccurrence
                };

                new_links.push(link);

                // Adds the values of these occurences to the tags counter
                // var coOccurrence = parseInt();
                allTags[occurrence.Tag1].soCount += (link.value || 0);
                allTags[occurrence.Tag2].soCount += (link.value || 0);
            }

            /* The graph needs an array and the indexes in links will be this array
            * indexes. That's why I created this like that, instead of pushing to
            * the array's last position.
            */
            var nodes = new Array(allTags.length);
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
