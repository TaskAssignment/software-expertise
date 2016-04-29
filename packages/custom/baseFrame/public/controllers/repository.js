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
      if(questionMarkIndex!=-1){
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

            if(optionsState.similarityType == 'jacard') {
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
        var fullRepoName;

        var issueTagData;
        var userCommitDataTags;

        var issueSOTagData;
        var userSOTagData;

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
              URL += $scope.repositoryName + '+in:name+';
          if($scope.repoDescription)
              URL += $scope.repoDescription + '+in:description+';
          if($scope.repoReadme)
              URL += $scope.repoReadme + '+in:readme+';
          if($scope.repoUser)
              URL += '+user:' + $scope.repoUser;
          URL += '&sort=stars&order=desc';

          console.log(URL);

          $http.get(URL)
            .success(function (response) {
                var results = response.items;
                console.log(response);
                $('#repoSelection').removeClass('hidden')
                var repos = [];
                for (var i = 0; i < results.length; i++) {
                    repos.push(
                      {
                          name: results[i].full_name
                      }
                    );
                }
                $scope.repos = repos;

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
          // var URL = 'https://api.github.com/repositories';
          fullRepoName = nameSelected;
          optionsState.repoName =  nameSelected;
          updateDeeplink();
          var userURL = 'https://api.github.com/repos/' +
            fullRepoName +
            '/contributors';

          $http.get(userURL)
            .success(function (response) {
                var results = response;
                $('#repositoyInfoDisplay').removeClass('hidden')
                $('#repoSelection').addClass('hidden')
                var users = [];
                for (var i = 0; i < results.length; i++) {
                    users.push(
                      {
                          name: results[i].login
                      }
                    )
                }
                $scope.repoName = fullRepoName;
                $scope.users = users;

            });
          var issueURL = 'https://api.github.com/repos/' +
            fullRepoName +
            '/issues';
          $http.get(issueURL)
            .success(function (response) {
                var results = response;
                $('#userSelection').removeClass('hidden')
                // $('#repoSelection').addClass('hidden')
                var issues = [];
                // issue matching deep linking
                var matchingIssue;
                for (var i = 0; i < results.length; i++) {
                    if(optionsState.issueId !== undefined) {
                        if (optionsState.issueId == results[i].id) {
                            matchingIssue = results[i];
                        }
                    }
                    issues.push(
                      {
                          title: results[i].title,
                          body: results[i].body,
                          id:results[i].id,
                      }
                    )
                }
                $scope.repoName = fullRepoName;
                $scope.issues = issues;

                if(optionsState.issueId !== undefined &&
                    optionsState.userName===undefined
                    ){
                    $scope.displayIssueTags(
                        matchingIssue.title,
                        matchingIssue.body,
                        matchingIssue.id
                    );
                } else if(optionsState.issueId === undefined &&
                    optionsState.userName !== undefined
                    ){
                    $scope.displayUserExpertise(optionsState.userName);
                } else if (optionsState.issueId !== undefined &&
                    optionsState.userName !== undefined){
                        $scope.displayIssueTags(
                            matchingIssue.title,
                            matchingIssue.body,
                            matchingIssue.id,
                            $scope.displayUserExpertise
                        );
                    }

            });
            //https://api.github.com/repos/owner/name/comments/

        }
        /**
         * displays the user portion of the expertise graph
         *
         * @param user - github username
         *
         *
         */
        $scope.displayUserExpertise = function(user){
            optionsState.userName = user;
            updateDeeplink();
            var usersRepos = 'https://api.github.com/users/' +
               user +
               '/repos';

           $http.get(usersRepos)
               .success(function(repoResponse) {
                   var tags =[];

                   var numberOfReposQueried = 0;
                   // TODO: replace 1 with actual amount repoResponse.length
                   for (var i = 0; i <1; i++) {
                       // TODO: switch commented section
                    //    var commitsURL = 'https://api.github.com/repos/' +
                    //        repoResponse[i].full_name +
                    //        '/commits?author=' + user +'&per_page=100';

                        var commitsURL = 'https://api.github.com/repos/' +
                            optionsState.repoName +
                            '/commits?author=' + user +'&per_page=100';
                       $http.get(commitsURL)
                           .success(function (usersResponse) {
                               //   .toLowerCase()
                               //   .split(' ');
                               // TODO: refactor in to function by text
                               for(var i=0;i<usersResponse.length;i++){
                                   var wordsFromCommitMessage = usersResponse[i].commit.message.toLowerCase()
                                     .split(' ');
                                   for(var j=0;j<wordsFromCommitMessage.length;j++){
                                       if (TagCountServices[wordsFromCommitMessage[j]] !== undefined) {
                                           tags.push(wordsFromCommitMessage[j]);
                                       }
                                   }
                               }
                               numberOfReposQueried++
                               // HACK: should use promise instead
                            //    if (numberOfReposQueried == repoResponse.length) {
                                //    drawData();
                            //    }
                                getSOIDForUser(user);
                           });

                   }
                   /**
                    * Makes an http post request to get the users matching SO information
                    *
                    * @param userName
                    *
                    */
                   function getSOIDForUser(userName){
                    //    ///// SO call
                       // https://api.stackexchange.com/docs/tags-on-users#order=desc&sort=popular&ids=1321917&filter=default&site=stackoverflow
                       // actual link http://api.stackexchange.com/2.2/users/1321917/tags?order=desc&sort=popular&site=stackoverflow&filter=!-.G.68phH_FJ
                       var urlStr = window.location.href.toString();
                       var questionMarkIndex = urlStr.indexOf('?');
                       if(questionMarkIndex!=-1){
                           urlStr = urlStr.slice(0,questionMarkIndex);
                       }
                       var apiCallUrl  = urlStr+'api/baseFrame/soIDFromUser';

                       $http({
                           method: 'POST',
                           url: apiCallUrl,
                           data: 'gitName='+userName,
                           headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                       }).success(function (soId) {
                                if(soId.length==1){
                                    var soURLStr = 'http://api.stackexchange.com/2.2/users/' +
                                        soId[0].SOId + '/tags?pagesize=10&order=desc&sort=popular&site=stackoverflow&filter=!-.G.68phH_FJ'
                                    $http.get(soURLStr)
                                        .success(function(soTags) {
                                            for(var i =0; i< soTags.items.length; i ++){
                                                for( var j =0; j<soTags.items[i].count; j++){
                                                    tags.push(soTags.items[i].name);
                                                }
                                            }
                                            drawData();

                                        });
                                } else {
                                    drawData();

                                }

                        });
                   }
                   /**
                    * convience function to ensure calling draw is done the same way
                    *
                    *
                    */
                   function drawData (){

                       tags.sort();
                       userCommitDataTags = tags;

                       graphs.drawWithNewData(issueTagData, userCommitDataTags,TagCountServices, $http, optionsState);
                   }

                });
           // https://api.github.com/users/dbsigurd/repos
           // while(i<)
        }
        /**
         * display information based on issues
         *
         * @param title, body, id, callback -
         *
         */
        $scope.displayIssueTags = function (title, body, id, callback) {
            // var URL = 'https://api.github.com/repositories';
            optionsState.issueId = id;
            updateDeeplink();
            var wordsFromTitle = title
                .toLowerCase()
                .split(' ');


            var wordsFromBody = body.toLowerCase()
                .split(' ');

            var tags = [];
            //Any word from the issue that is an SO tag will be in this array.
            //This is the array that is sent to '/api/baseFrame/coOccurence'
            for (var i = 0; i < wordsFromBody.length; i++) {
                if (TagCountServices[wordsFromBody[i]] !== undefined) {
                    tags.push(wordsFromBody[i]);
                }
            }
            for (var i = 0; i < wordsFromTitle.length; i++) {
                if (TagCountServices[wordsFromTitle[i]] !== undefined) {
                    tags.push(wordsFromTitle[i]);
                }
            }
            tags.sort();
            issueTagData = tags;
            if(callback === undefined){
                graphs.drawWithNewData(issueTagData, userCommitDataTags,TagCountServices,  $http, optionsState);
            } else {
                callback(optionsState.userName);
            }
        }
        $scope.package = {
          name: 'baseFrame'
        };
        var optionsChanged;
        /**
         * updates whether to show user options
         *
         * @param show - boolean
         *
         */
        $scope.displayOptionsMenu = function(show){
            optionsChanged = true;
            d3.select('#graphOptionsMenu').classed('hidden',false);
            d3.select('#graphOptionsMenu').style('top','0px');
        }
        /**
         * updates SO node weight
         *
         * @param choice - string
         *
         */
        $scope.setGraphOptionSO = function(choice) {
            optionsChanged = true;
            d3.select('#soOptions').selectAll('.optionButton')
                .property('checked', false);
            d3.select('#soOptions').select('#' + choice+'SizeOccurrences').property('checked', true);
            optionsState.soWeight = choice;
        }
        /**
         * updates git node weight option
         *
         * @param choice - string
         *
         */
        $scope.setGraphOptionGit = function(choice) {
            optionsChanged = true;
            d3.select('#gitOptions').selectAll('.optionButton')
                .property('checked', false);
            d3.select('#gitOptions').select('#' + choice+'SizeOccurrences').property('checked', true);
            optionsState.gitWeight = choice;
        }
        /**
         * updatesdirected graph option
         *
         * @param choice - string
         *
         */
        $scope.setGraphOptionDirected = function(choice) {
            optionsChanged = true;
            d3.select('#directionOptions').selectAll('.optionButton')
                .property('checked', false);
            d3.select('#directionOptions').select('#directed' + choice).property('checked', true);
            optionsState.directed = choice;
        }
        /**
         * calls draw only if options changed
         *
         *
         */
        $scope.closeAndResetOptions = function(){
            if(optionsChanged){
                updateDeeplink();
                if (issueTagData == undefined &&
                    userCommitDataTags == undefined){
                } else{
                    graphs.draw(issueTagData, userCommitDataTags,TagCountServices,  $http);
                }
            } else {

            }
            d3.select('#graphOptionsMenu').classed('hidden',true);
            d3.select('#graphOptionsMenu').style('top','0px');
        }
        /**
         * highlight tags on graph
         *
         *
         */
        $scope.findTag = function() {
             var searchString = $scope.nodeSearchBox.toLowerCase();

             var searchedTags = searchString.split(' ');
             graphs.search(searchedTags);
             $scope.nodeSearchBox = '';
        }
        $scope.setGraphOptionCosine = function() {
            if(optionsState.similarityType == 'cosine') return

            optionsState.similarityType = 'cosine'
            d3.select('#adjTrue').property('checked', false);
        }
        $scope.setGraphOptionAdjustedWeight = function() {
            if(optionsState.similarityType == 'jacard') return
            optionsState.similarityType = 'jacard'
            d3.select('#cosineTrue').property('checked', false);
        }


    }
]);

/**
 * Class that handles drawing of the expertise graph
 *
 * @param initConfig - initial graph options
 *
 */

function ExpertiseGraph(initConfig) {
    // var expertSVG = d3.select('#expertiseGraphDiv')
    //    .append('svg')
    //    .attr('width', svgWidth + 'px')
    //    .attr('height', '500px');

    /**
     * modifies Array to have unique FUNCTION
     *
     *
     */
    Array.prototype.getUnique = function(){
        var u = {}, a = [];
        for(var i = 0, l = this.length; i < l; ++i){
          if(u.hasOwnProperty(this[i])) {
             continue;
          }
          a.push(this[i]);
          u[this[i]] = 1;
        }
        return a;
    }
    var graphConfig = initConfig;
    ///////////////////////////////////////////////////////////////////////////
    var expertGraph = this;
    var width = window.innerWidth - d3.select('#leftSelectionPanel').node().getBoundingClientRect().width - 5;
    var height = window.innerHeight - d3.select('.page-header').node().getBoundingClientRect().height - 5;


    // GRAPH DATA
    var graphLinks = [];
    var nodes = {};


    var svg = d3.select("#expertiseGraphDiv").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('id','expertiseGraph');


    // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
      .enter().append("marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 50)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");


    var outerG = svg.append('g').attr('id','outerGrouping');


    var focus_node = null, highlight_node = null;

    var text_center = false;
    var outline = false;

    var min_score = 0;
    var max_score = 1;
    var default_node_color = "#ccc";
    //var default_node_color = "rgb(3,190,100)";
    var default_link_color = "#888";
    var nominal_base_node_size = 8;
    var nominal_text_size = 10;
    var max_text_size = 24;
    var nominal_stroke = 1.5;
    var max_stroke = 4.5;
    var max_base_node_size = 36;
    var min_zoom = 0.1;
    var max_zoom = 7;
    var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom]);
    var currentZoom = 1;

    var highlight_color = "blue";
    var highlight_trans = 0.1;
    var nodeLabels;
    var soNode;
    var userNode;
    var issueNode;
    var linkPath;
    var linkedByIndex = {};

    var size = d3.scale.pow().exponent(1)
        .domain([1,100])
        .range([8,24]);
    ///////////////////////////////////////////////////////////////////////////
    //                      HELPER FUNCTIONS
    ///////////////////////////////////////////////////////////////////////////
    /**
     * show/hide loading screen
     *
     *
     */
    function showLoadingScreen(){
        d3.select('#loadingImage').style('display','block');
    }
    function hideLoadingScreen(){
        d3.select('#loadingImage').style('display','none');

    }
    /**
     * formats SO Data so it can be graphed
     *
     * @param issueTagData, userCommitDataTags, TagCountServices
     *
     */
    function formatSOData(issueTagData, userCommitDataTags, TagCountServices) {
        /**
         * generates js obj of counts for tags in a array.
         *
         * @param ary, classifier
         *
         */
        var countValues = function(ary, classifier) {
            return ary.reduce(function(counter, item) {
                var p = (classifier || String)(item);
                counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
                return counter;
            }, {})
        }


        var allTags;
        var issueCounts;
        var userCounts;

        if(issueTagData !== undefined &&
            userCommitDataTags !==undefined){
            allTags = issueTagData.concat(userCommitDataTags);
            userCounts = countValues(userCommitDataTags);
            issueCounts = countValues(issueTagData);

        } else if( issueTagData !== undefined) {
            allTags = issueTagData;
            issueCounts = countValues(issueTagData);

        } else if(userCommitDataTags!== undefined){
            allTags = userCommitDataTags;
            userCounts = countValues(userCommitDataTags);

        } else {
            return [];
        }
        allTags = allTags.getUnique();
        allTags.sort();
        var formattedData =[];

        for(var i = 0;i < allTags.length; i++){
            var countFromIssue = 0;
            var countFromUser = 0;
            if (issueTagData !== undefined) {
                if (issueTagData.indexOf(allTags[i])!==-1){
                    countFromIssue = issueCounts[allTags[i]];
                } else {
                    countFromIssue = 0;
                }
            }
            if (userCommitDataTags !== undefined){
                if (userCommitDataTags.indexOf(allTags[i])!==-1){
                    countFromUser = userCounts[allTags[i]];
                } else {
                    countFromUser = 0;
                }
            }

            formattedData.push({
                'tagName': allTags[i],
                'soCount': TagCountServices[allTags[i]].Count,
                'userCount': countFromUser,
                'issueCount': countFromIssue,

            });

        }
        return formattedData;
    }

    /**
     * is a connected to b
     *
     * @param a, b
     *
     */
    function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

    /**
     * does a have a connection?
     *
     * @param a
     *
     */
    function hasConnections(a) {
        for (var property in linkedByIndex) {
            s = property.split(",");
            if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) {
                return true;
            }
        }
        return false;
    }
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    /**
     * step simulation forward
     *
     *
     */
    function tick() {
        linkPath.attr("d", linkArc);
        soNode.attr("transform", transform);
        userNode.attr("transform", transform);
        issueNode.attr("transform", transform);
        nodeLabels.attr("transform", transform);
    }

    function linkArc(d) {
        if(graphConfig.directed){
            var dx = d.target.x- d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + (d.target.x) + "," + (d.target.y);
        } else {
            var dx = d.target.x- d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "L" + "  " + (d.target.x) + "," + (d.target.y);
        }
    }
    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }

    /**
     * highlight Multiple or single node.
     * @param d, showMany
     *
     */
    function set_highlight(d,showMany) {
        var highlightMult = showMany == true ? true : false;
        if (highlight_color!="white")
        {
            soNode.classed('dimmed', function(o) {
                return isConnected(d, o) ? false : true;
            })
            // .style('opacity',0.6);
            userNode.classed('dimmed', function(o) {
                return isConnected(d, o) ? false : true;
            })
            // .style('opacity',0.6);
            issueNode.classed('dimmed', function(o) {
                return isConnected(d, o) ? false : true;
            })
            // .style('opacity',0.6);
            nodeLabels.style("font-weight", function(o) {
                return isConnected(d, o) ? "bold" : "normal";});
            linkPath.style("stroke", function(o) {
                return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
            });
            linkPath.style("opacity", function(o) {
                return o.source.index == d.index || o.target.index == d.index ? .7 : 0
            });
        }
    }
    function clear_highlight(d) {
        soNode.classed('dimmed',false);
        userNode.classed('dimmed',false);
        issueNode.classed('dimmed',false);
        nodeLabels.style("font-weight", "normal");
        linkPath.classed('hideLine',false);

        linkPath.style("stroke", default_link_color)
        .style("opacity", function(o) {
            return 0.5
        });
    }
    var maxNodeSize = 20;
    var minNodeSize = 6;
    var weightScale = d3.scale.linear()
        .domain([0,1])
        .range([minNodeSize,maxNodeSize]);
    var strokeScale = d3.scale.linear()
        .domain([0,1])
        .range([1,4])
    var soScaleFunction;
    var issueScaleFunction;
    var userScaleFunction;

    var storkeWidthFunction;
    var force ;
    var similarityBetweenBugAndUser;



    ///////////////////////////////////////////////////////////////////////////
    //                      HELPER FUNCTIONS END
    expertGraph.search = function (targets) {
        d3.selectAll('.soNode').classed('searched',false);
        d3.selectAll('.link').classed('hideLine',true);
        var unhideLines =[];
        for(var i = 0; i < targets.length; i++){
            var target = d3.select('#soNode' + targets[i] );
            if(target[0][0] !== null){
                target.classed('searched',function(d){
                    // set_highlight(d,true);
                    linkPath.classed("searching", function(o) {
                        if(o.source.index == d.index || o.target.index == d.index){
                            unhideLines.push(o);
                        }
                        return false;
                        // return o.source.index == d.index || o.target.index == d.index ? false
                    });
                    return true;
                })
            }
        }
        for(var i = 0; i < unhideLines.length; i++){
            d3.select('#link'+ unhideLines[i].name)
                .classed('hideLine', false);
        }
        if(d3.selectAll('.searched')[0][0]==null){

            window.alert('there is no tag that match your search in this graph.')
        } else {
            d3.selectAll('circle').classed('dimmed',true);
            d3.selectAll('.searched').classed('dimmed',false);
        }
    }
    function calculateSimilarity (bugTags, userTags, TagCountServices){
        // if()
        var countValues = function(ary, classifier) {
            return ary.reduce(function(counter, item) {
                var p = (classifier || String)(item);
                counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
                return counter;
            }, {})
        }
        var bugTagCounts = countValues(bugTags);
        var userTagCounts = countValues(userTags);
        function calculateCosineSimilarity (){
            var nominatorSum=0;
            var uniqueBugTags = bugTags.getUnique();
            for (var i =0;i<uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] !== undefined){
                    nominatorSum += bugTagCounts[uniqueBugTags[i]]*userTagCounts[uniqueBugTags[i]];
                }
            }

            var developerSum = 0;
            var uniqueDevTags = userTags.getUnique();

            for (var i = 0; i <uniqueDevTags.length; i++){
                developerSum+= userTagCounts[uniqueDevTags[i]]*userTagCounts[uniqueDevTags[i]];
            }

            var bugSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                bugSum+= bugTagCounts[uniqueBugTags[i]]*bugTagCounts[uniqueBugTags[i]];
            }

            var denominator= Math.sqrt(developerSum) * Math.sqrt(bugSum);
            if (denominator == 0 ){
                console.log('div by 0 err')
                var similarity = 0;
            } else {

                var similarity = nominatorSum / denominator;
            }

            return similarity
        }
        function getSOWeight(soNodeCount) {
            if (graphConfig['soWeight'] == 'linear') {
                return 1 / soNodeCount;
            } else if (graphConfig['soWeight'] == 'log') {
                if (soNodeCount == 1) return 0;
                return 1/ Math.log(soNodeCount);
            } else {
                return 1/Math.sqrt(soNodeCount);
            }
        }

        function getWeightOfNode (nodeCount,nodeName,accessor) {
            if (graphConfig[accessor] == 'sqrt'){
                var weight;
                if (nodeCount === 0){
                    weight = 0;
                } else {
                    weight = (1 / Math.sqrt(nodeCount));
                }

                return weight;

            } else if (graphConfig[accessor] == 'linear') {
                var weight;
                if (nodeCount === 0){
                    weight = 0;
                } else {
                    weight = (1 / nodeCount);
                }
                return weight;

            } else if (graphConfig[accessor] == 'log'){

                var weight;
                if (nodeCount ==1){
                    weight = 0;
                } else if (nodeCount ==0){
                    weight = 0
                } else {
                    weight = 1 / Math.log(nodeCount);
                }
                return weight;

            } else if(graphConfig[accessor] == 'adjusted') {
                var weight;
                var weightSOTag = getSOWeight(TagCountServices[nodeName]);

                weight = 1 - ((1 - weightSOTag) / (nodeCount));

                return weight;
            }

        }
        function calculateJustNodeSimilarity(){
            var nominatorSum = 0;
            var uniqueBugTags = bugTags.getUnique();

            for (var i = 0; i < uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] == undefined) {
                    nominatorSum += bugTagCounts[uniqueBugTags[i]];
                } else {
                    nominatorSum += d3.min([
                            getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight'),
                            getWeightOfNode(userTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight')
                        ]);
                }
            }

            var denominatorSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                denominatorSum += getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight');
            }
            var results;
            if(denominatorSum == 0){
                results = 0;
            } else {
                results = nominatorSum / denominatorSum
            }
            return results;
        }
        function calculateEdgeWeight( occurenceIName, occurenceJName ) {

            var coOIJ; // co occurence I and J
            if(coOccurenceDictionary[occurenceIName + occurenceJName] !== undefined) {
                coOIJ = coOccurenceDictionary[occurenceIName + occurenceJName];
            } else if (coOccurenceDictionary[occurenceJName + occurenceIName] !== undefined) {
                coOIJ = coOccurenceDictionary[occurenceJName + occurenceIName];

            } else {
                return 0;
            }

            if(graphConfig['directed']) {
                return coIJ / TagCountServices[occurenceIName];
            } else {
                return (2*coIJ) / (TagCountServices[occurenceIName] + TagCountServices[occurenceJName]);

            }
        }
        function calculateEdgeOverLap(){
            var nominatorSum = 0;
            var uniqueBugTags = bugTags.getUnique();

            for (var i = 0; i < uniqueBugTags.length; i++){
                if (userTagCounts[uniqueBugTags[i]] == undefined) {
                    nominatorSum += bugTagCounts[uniqueBugTags[i]];
                } else {
                    nominatorSum += d3.min([
                            getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight'),
                            getWeightOfNode(userTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight')
                        ]);
                }
            }

            var denominatorSum = 0;
            for(var i = 0; i < uniqueBugTags.length; i++){
                denominatorSum += getWeightOfNode(bugTagCounts[uniqueBugTags[i]], uniqueBugTags[i], 'userWeight');
            }
            var results;
            if(denominatorSum == 0){
                results = 0;
            } else {
                results = nominatorSum / denominatorSum
            }
            return results;
        }
        function calculateEdgeAndNodeSimilarity(){
            var justNodeSim = calculateJustNodeSimilarity();

        }
        if(graphConfig['similarityType'] == 'jacard') {

            return calculateJustNodeSimilarity();

        } else  {

            return calculateCosineSimilarity();
        }
    }
    //get new data and redraw
    var coOccurenceDictionary = {};

    expertGraph.drawWithNewData = function(issueTagData, userCommitDataTags,TagCountServices, $http, optionsState){
        graphConfig = optionsState;

        // http://blog.thomsonreuters.com/index.php/mobile-patent-suits-graphic-of-the-day/
        var urlStr = window.location.href.toString();
        var questionMarkIndex = urlStr.indexOf('?');
        if(questionMarkIndex!=-1){
            urlStr = urlStr.slice(0,questionMarkIndex);
        }
        var apiCallUrl  = urlStr+'api/baseFrame/coOccurence';

        //&tag=javascript&tag=d3.js&tag=html&tag=jquery&tag=css&tag=svg'

        var fullData = formatSOData(issueTagData, userCommitDataTags, TagCountServices);
        var dataString='';

        for(var i = 0; i < fullData.length; i++){
            dataString += 'tag=' + fullData[i].tagName;
            if(i!== fullData.length - 1){
                dataString+='&';
            }
        }
        showLoadingScreen();

        $http({
            method: 'POST',
            url: apiCallUrl,
            data: dataString,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (response) {
            fullData = formatSOData(issueTagData, userCommitDataTags, TagCountServices);
            graphLinks=[];
            nodes={};
            hideLoadingScreen();

            for(var i = 0; i < response.length; i++) {
                coOccurenceDictionary[response[i].Tag1 + response[i].Tag2] =  +response[i].CoOccurrence;
                graphLinks.push({
                    'source': response[i].Tag1,
                    'target': response[i].Tag2,
                    'coOccurrence': +response[i].CoOccurrence,
                    'name': response[i].Tag1 + response[i].Tag2,
                    'type': "resolved"
                });
                graphLinks.push({
                    'source': response[i].Tag2,
                    'target': response[i].Tag1,
                    'coOccurrence': +response[i].CoOccurrence,
                    'name': response[i].Tag2 + response[i].Tag1,
                    'type': "resolved"
                });
            }
            var tempSetupNode = {};
            for(var i = 0; i < fullData.length; i++){
                tempSetupNode[fullData[i].tagName] = {
                    name: fullData[i].tagName,
                    soCount: fullData[i].soCount,
                    userCount: fullData[i].userCount,
                    issueCount: fullData[i].issueCount,
                }
            }
            // Compute the distinct nodes from the graphLinks.

            graphLinks.forEach(function(link) {
                link.source = nodes[link.source] || (nodes[link.source] = {
                    name: link.source,
                    coOccurrence: link.coOccurrence,
                    soCount: tempSetupNode[link.source].soCount,
                    userCount: tempSetupNode[link.source].userCount,
                    issueCount: tempSetupNode[link.source].issueCount,
                });
                link.target = nodes[link.target] || (nodes[link.target] = {
                    name: link.target,
                    coOccurrence: link.coOccurrence,
                    soCount: tempSetupNode[link.target].soCount,
                    userCount: tempSetupNode[link.target].userCount,
                    issueCount: tempSetupNode[link.target].issueCount,
                });
            });
            linkedByIndex = [];
            graphLinks.forEach(function(d) {
                linkedByIndex[d.source + "," + d.target] = true;
            });
            force = d3.layout.force()
                .nodes(d3.values(nodes))
                .links(graphLinks)
                .size([width, height])
                .linkDistance(function(d,i){
                    // console.log(d);
                    return Math.random()*200 + 200;
                })
                .alpha(0.001)
                .friction(0.3)
                .charge(-3000)
                .on("tick", tick)
                .start();


            linkPath = outerG.selectAll(".link")
                .data(force.links(),function(d){
                    return d.name;
                });

            linkPath.enter().append("path")
                .attr("class", function(d) { return "link " + d.type; })
                .attr('pointer-events','none')
                .attr("marker-end", function(d) {
                    var urlStr = window.location.href.toString();
                    var questionMarkIndex = urlStr.indexOf('?');
                    if(questionMarkIndex!=-1){
                        urlStr = urlStr.slice(questionMarkIndex,urlStr.length);
                    } else {
                        urlStr = "";
                    }
                    if(graphConfig.directed){

                        return "url("+urlStr +"#" + "resolved" + ")";
                    } else {
                        return "url(#none)";
                    }
                })
                .attr('id', function(d){
                    return 'link'+d.name;
                })
                .style("opacity", function(o) {
                    return 0.5
                });
            linkPath.exit().remove();
            soNode = outerG.selectAll(".soNode")
                .data(force.nodes(), function(d){
                    return d.name;
                });

            soNode.enter().append("circle")
                .attr("r", 0)
                .attr('id', function(d){
                    return 'soNode'+d.name;
                })
                .classed('soNode',true);

            userNode = outerG.selectAll(".userNode")
                .data(force.nodes(), function(d){
                    return d.name;
                });
            userNode.enter().append("circle")
                .attr("r", 0)
                .classed('userNode',true)


            issueNode = outerG.selectAll(".issueNode")
                .data(force.nodes(), function(d){
                    return d.name;
                });
            issueNode.enter().append("circle")
                .attr("r", 0)
                .classed('issueNode',true);
                // .call(drag);


            nodeLabels = outerG.selectAll("text")
                .data(force.nodes(), function(d){
                    return d.name;
                });
            nodeLabels.enter().append("text")
                .attr("x", 8)
                .attr('pointer-events','none')
                .attr("y", ".31em")
                .text(function(d) { return d.name; });
            // Use elliptical arc path segments to doubly-encode directionality.

            expertGraph.draw(issueTagData, userCommitDataTags);
            if(issueTagData !== undefined &&
                userCommitDataTags !== undefined){
                if(issueTagData.length !== 0 &&
                    userCommitDataTags.length !== 0){

                    similarityBetweenBugAndUser = calculateSimilarity(issueTagData,userCommitDataTags, TagCountServices);
                } else {
                    similarityBetweenBugAndUser = 0;
                }
            }
        });
    }
    expertGraph.draw = function(issueTagData, userCommitDataTags,TagCountServices, $http) {
        // graphConfig = optionsState;

        if(issueTagData !== undefined &&
            userCommitDataTags !== undefined){
            if(issueTagData.length !== 0 &&
                userCommitDataTags.length !== 0){

                similarityBetweenBugAndUser = calculateSimilarity(issueTagData,userCommitDataTags, TagCountServices);
            } else {
                similarityBetweenBugAndUser = 0;
            }
            d3.select("#similarityValue").text(similarityBetweenBugAndUser);
            d3.select("#similarText").classed('hidden',false);

        } else {
            d3.select("#similarText").classed('hidden',true);

        }
        if(graphConfig.directed){
            storkeWidthFunction = function(d){
                var size = strokeScale(
                    d.source.coOccurrence / d.source.soCount
                );
                return size;
            }
        } else {
            storkeWidthFunction = function(d){
                var size = strokeScale(
                    2* d.source.coOccurrence / (d.source.soCount + d.target.soCount)
                );
                return size;
            }
        }

        if (graphConfig.soWeight == 'sqrt'){
            soScaleFunction = function(d){
                var weight;
                if (d.soCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / Math.sqrt(d.soCount)));

                }
                return weight;
            }
        } else if (graphConfig.soWeight == 'log'){
            soScaleFunction = function(d){
                var weight;
                if (d.soCount  == 1){
                    weight = weightScale(1);
                } else if (d.soCount == 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / Math.log(d.soCount)));

                }
                return weight
            }
        } else if (graphConfig.soWeight == 'linear') {
            soScaleFunction = function(d){
                var weight;
                if (d.soCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / d.soCount));

                }
                return weight
            }
        }  else {
            soScaleFunction = function(d){
                var weight;
                if (d.soCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / d.soCount));

                }
                return weight
            }
        }
        if (graphConfig.gitWeight == 'sqrt'){
            issueScaleFunction= function(d){
                var weight;
                if (d.issueCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / Math.sqrt(d.issueCount)));
                }

                return weight;
            }
            userScaleFunction = function(d){
                var weight;
                if (d.userCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / Math.sqrt(d.userCount)));
                }

                return weight;
            }
        } else if (graphConfig.gitWeight == 'linear') {
            issueScaleFunction = function(d){
                var weight;
                if (d.issueCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / d.issueCount));
                }

                return weight;
            }
            userScaleFunction = function(d){
                var weight;
                if (d.userCount === 0){
                    weight = 0;
                } else {
                    weight = weightScale((1 / d.userCount));
                }
                return weight
            }
        } else if (graphConfig.gitWeight == 'log'){
            issueScaleFunction = function(d){
                var weight;
                if (d.issueCount ==1){
                    weight = weightScale(1);
                } else if (d.issueCount ==0){
                    weight = 0
                }  else {
                    weight = weightScale((1 / Math.log(d.issueCount)));
                }
                return weight
            }
            userScaleFunction = function(d){
                var weight;
                if (d.userCount ==1){
                    weight = weightScale(1);
                } else if (d.userCount ==0){
                    weight = 0
                } else {
                    weight = weightScale((1 / Math.log(d.userCount)));
                }
                return weight
            }
        } else  {
            issueScaleFunction = function(d){
                var weight;
                if (d.issueCount === 0){
                    weight = 0;
                } else if(d.issueCount == 1){
                    weight = weightScale((1));
                } else {
                    weight = weightScale((1 / Math.log(d.issueCount)));
                }
                return weight;
            }
            userScaleFunction = function(d){
                var weight;
                if (d.userCount === 0){
                    weight = 0;
                } else if(d.userCount == 1){
                    weight = weightScale((1));
                } else {
                    weight = weightScale((1 / Math.log(d.userCount)));
                }

                return weight
            }
        }

        soNode.transition()
            .delay(200)
            .duration(500)
            .attr('r', function(d){
                return soScaleFunction(d);
            });
        soNode.on("mouseover", function(d) {
                set_highlight(d);
            })
            .on('mouseout',function(d){
                clear_highlight(d);
            });
        soNode.exit().remove();
        userNode.transition()
            .delay(200)
            .duration(500)
            .attr('r', function(d){
                    return userScaleFunction(d);
                });
        userNode.on("mouseover", function(d) {
                set_highlight(d);
            })
            .on('mouseout',function(d){
                clear_highlight(d);
            });
        userNode.exit().remove();

        issueNode.transition()
            .delay(200)
            .duration(500)
            .attr('r', function(d){
                return issueScaleFunction(d);
            });
        issueNode.on("mouseover", function(d) {
                set_highlight(d);
            })
            .on('mouseout',function(d){
                clear_highlight(d);
            });
        issueNode.exit().remove();


        nodeLabels.transition()
            .text(function(d) { return d.name; });
        linkPath.style('stroke-width',function(d){
                return storkeWidthFunction(d);
            }).attr("marker-end", function(d) {
                var urlStr = window.location.href.toString();
                var questionMarkIndex = urlStr.indexOf('?');
                if(questionMarkIndex!=-1){
                    urlStr = urlStr.slice(questionMarkIndex,urlStr.length);
                } else {
                    urlStr = "";
                }
                if(graphConfig.directed){

                    return "url("+urlStr +"#" + "resolved" + ")";
                } else {
                    return "url(#none)";
                }
            });
        tick();
        window.setTimeout(function(){

            force.stop();
        },10000);
        nodeLabels.exit().remove();
        zoom.on("zoom", function() {
            currentZoom = zoom.scale();

            soNode.attr('r', function(d){
                return soScaleFunction(d);
            });
            userNode.attr('r', function(d){
                return userScaleFunction(d);
            });
            issueNode.attr('r', function(d){
                return issueScaleFunction(d);
            });
            outerG.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            linkPath.style('stroke-width', function(d){
                return storkeWidthFunction(d);
            });
        });
        svg.call(zoom);
    }
    // window.resize = function(){
    //     var width = window.innerWidth - d3.select('#leftSelectionPanel').node().getBoundingClientRect().width - 5;
    //     var height = window.innerHeight - d3.select('.page-header').node().getBoundingClientRect().height - 5;
    //     var svg = d3.select("#expertiseGraphDiv").select('#expertiseGraph')
    //         .attr("width", width)
    //         .attr("height", height);
    //     // force = d3.layout.force()
    //     //     .size([width, height]);
    // };


}
