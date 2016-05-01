'use strict';

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

      var TagCountServices = {};
      var urlStr = window.location.href.toString();
      var questionMarkIndex = urlStr.indexOf('?');
      if(questionMarkIndex!==-1){
          urlStr = urlStr.slice(0,questionMarkIndex);
      }
      var apiCallUrlSO  = urlStr+'api/baseFrame/soTags';
      /**
       * Makes an http post request to get json back with the tags.
       * uses call to get defaults
       *
       * @param response - all SOTAGS on server
       * @return
       *
       */

      $http({
          method: 'POST',
          url: apiCallUrlSO,
          data: '',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function (response){
          TagCountServices = response;
          getDefaultOptions();
      });
      /**
       * Updates the url based on the current state of the project
       *
       *
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

        /**
         *
         */
        function getDefaultOptions(){
            var deepLinkParams = $location.search();
            for (var key in deepLinkParams) {
                if(optionsState[key] === undefined)
                    optionsState[key] = deepLinkParams[key];
            }

            // Not sure if I'll keep this in this function
            var cosineChecked = true;
            var adjChecked = false;

            if(optionsState.similarityType === 'jacard') {
                cosineChecked = false;
                adjChecked = true;
            }

            d3.select('#cosineTrue').property('checked', cosineChecked);
            d3.select('#adjTrue').property('checked', adjChecked);

            initializeStates();
        }

        var graphs;
        /**
         * sets menus to match states and inits the expertise graph
         */
        function initializeStates() {

            d3.select('#soOptions').selectAll('.optionButton')
                            .property('checked', false);
            d3.select('#soOptions').select('#' + optionsState.soWeight+'SizeOccurrences').property('checked', true);

            d3.select('#gitOptions').selectAll('.optionButton')
                            .property('checked', false);
            d3.select('#gitOptions').select('#' + optionsState.gitWeight+'SizeOccurrences').property('checked', true);

            d3.select('#directionOptions').selectAll('.optionButton')
                            .property('checked', false);
            d3.select('#directionOptions').select('#directed' + optionsState.directed).property('checked', true);

            if(optionsState.repoName !== undefined){
                $scope.getRepoInformation(optionsState.repoName);
            }
            graphs = new ExpertiseGraph(optionsState);

        }

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
                    data: 'gitName='+userName,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function (response, soId) {
                    var soId = undefined;
                    if(response.length === 1){
                        soId = response[0].SOId;
                    }

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
            var wordsFromTitle = issue.title.toLowerCase().split(' ');
            var wordsFromBody = issue.body.toLowerCase().split(' ');

            //Any word from the issue that is an SO tag will be in this array.
            //This is the array that is sent to '/api/baseFrame/coOccurrence'
            tagsFromIssue = {}; //Global variable. Ugh

            for(let word of wordsFromBody) {
                addTagToIssueTags(word);
            }

            for(let word of wordsFromTitle) {
                addTagToIssueTags(word)
            }

            sendToGraph();

            function addTagToIssueTags(word){
                //Is this word a SO tag?
                if (TagCountServices[word] !== undefined) {
                    //Has this been added to the issue tags?
                    if(tagsFromIssue[word] === undefined){
                        tagsFromIssue[word] = 1;
                    } else {
                        tagsFromIssue[word] += 1;
                    }
                }
            }
        }

        function sendToGraph(){
            graphs.drawWithNewData(tagsFromIssue, tagsFromUserOnSO,
              TagCountServices, $http, optionsState);
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
    ///////////////////////////////////////////////////////////////////////////
    var expertGraph = this;


    expertGraph.drawWithNewData = function(tagsFromIssue, tagsFromUserOnSO,
      TagCountServices, $http, optionsState){
        graphConfig = optionsState;
        var allTags = mergeTags();

        var dataString='';
        for(var tag in allTags){
            dataString += 'tag=' + tag + '&';
        }

        $http({
            method: 'POST',
            url: '/api/baseFrame/coOccurrence',
            data: dataString,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (links) {
            drawGraph(links, allTags);
        });

        function drawGraph(links, allTags){

          //temporary numbers just to see how things work
          var width = 600; //window.innerWidth - d3.select('#leftSelectionPanel').node().getBoundingClientRect().width - 5;
          var height = 600; //window.innerHeight - d3.select('.page-header').node().getBoundingClientRect().height - 5;

          var color = d3.scale.category20();

          var force = d3.layout.force()
              .charge(-120)
              .linkDistance(100)
              .size([width, height]);

          d3.select('svg').remove(); //Remove old svg before adding a new one.

          var svg = d3.select('#expertiseGraphDiv').append("svg")
              .attr("width", width)
              .attr("height", height);

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

          var link = svg.selectAll(".link")
              .data(graph.links)
            .enter().append("line")
              .attr("class", "link")
              .style("stroke-width", function(d) { return Math.sqrt(d.weight); });

          var node = svg.selectAll(".node")
              .data(graph.nodes)
              .enter().append("g")
                .attr("class", "node")
                .call(force.drag);

          var circle = node.append("circle")
              .attr("r", 10)
              .style("fill", function(d) { return color(d.origin); });

          circle.on("click", function(){
              var circle = d3.select(this);
              circle.attr("r", 20);
          });

          node.append("text")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) { return d.name });


          force.on("tick", function() {
              link.attr("x1", function(d) { return d.source.x; })
                  .attr("y1", function(d) { return d.source.y; })
                  .attr("x2", function(d) { return d.target.x; })
                  .attr("y2", function(d) { return d.target.y; });

              node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
              // node.attr("cx", function(d) { return d.x; })
              //     .attr("cy", function(d) { return d.y; });
          });

        }

        function formatDataToGraph(links, allTags){
            var graph = {};
            var new_links = []
            for(var occurrence of links){
                new_links.push({
                    source: allTags[occurrence.Tag1].index,
                    target: allTags[occurrence.Tag2].index,
                    value: occurrence.coOccurrence
                });
            }

            var nodes = new Array(allTags.length);
            for(var tag in allTags){
                nodes[allTags[tag].index] = {
                    name: tag
                };
            }

            var graph = {
                nodes: nodes,
                links: new_links
            }
            return graph;
        }

        function mergeTags(){
            var allTags = {};
            var index = 0;
            for(var tag in tagsFromIssue){
                allTags[tag] = {
                    name: tag,
                    origin: 'issue',
                    index: index,
                    count: tagsFromIssue[tag]
                }
                index++;
            }

            for(var tag in tagsFromUserOnSO){
                if(allTags[tag] === undefined) {
                    allTags[tag] = {
                        name: tag,
                        origin: 'SO',
                        index: index,
                        count: tagsFromUserOnSO[tag]
                    }
                    index++;
                }else{
                    allTags[tag].origin = 'both';
                    allTags[tag].count += tagsFromUserOnSO[tag]
                }
            }

            return allTags;
        }
    }
}
