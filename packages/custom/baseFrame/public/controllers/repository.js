'use strict';

function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}

var baseFrame = angular.module('mean.baseFrame');

baseFrame.controller('RepositoryController',
['$scope', '$http', '$location', '$resource',
function ($scope,  $http, $location, $resource) {
    var tagsFromIssue;
    var tagsFromUserOnSO;
    findProject();

    // *************** SCOPE FUNCTIONS **************//

    $scope.populateSoTags = function(){
        populateRequest('/api/baseFrame/populateSoTags');
    }

    $scope.populateSoUsers = function(){
        populateRequest('/api/baseFrame/populateSoUsers');
    }

    $scope.populateCoOccurrences = function(){
        populateRequest('/api/baseFrame/populateCoOccurrences');
    }

    $scope.populateStopWords = function(){
        populateRequest('/api/baseFrame/populateStopWords');
    }
    /** Looks for repositories with the given filters
     */
    $scope.queryRepos = function () {
        showLoadingScreen();
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

        $http.get(URL).then(function (response) {
            var results = response.data.items;
            console.log(response.headers);
            // TODO: Figure out how to get next items

            var repos = [];
            for (var result of results) {
                var repo = {
                    name: result.full_name,
                    _id: result.id,
                    language: result.language,
                    description: result.description
                };
                repos.push(repo);
            }
            $scope.repos = repos;
            hideLoadingScreen();
        });
    }

    $scope.saveProject = function(repo){
        console.log(repo);
        var Project = $resource('/api/baseFrame/project/new/');
        Project.get(repo).$promise.then(function(project){
            getRepoInformation(repo);
        });
    }


    $scope.populateRepoResources = function (resource){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/:projectId/' +
            resource + '/populate');
        var filter = {
            projectId: $scope.selectedRepo._id
        }
        Resource.get(filter).$promise.then(function (response){
            $scope.selectedRepo['empty' + resource] = false;
            hideLoadingScreen();
        });
    }
    /**
    * Displays the user portion of the expertise graph, based on StackOverflow
    * user tags.
    *
    * @param username - github username
    */
    $scope.displayUserExpertise = function(user){
        $location.search('username', user._id);
        $scope.selectedUser = user;

        if(user.soId){
            showLoadingScreen();
            var Resource = $resource('/api/baseFrame/user/:_id/tags');
            Resource.query({_id: user._id}).$promise.then(function(tags){
                hideLoadingScreen();
                if(tags.length == 0){
                    $scope.selectedUser.emptyTags = true;
                    populateUserTags();
                }
                convertTags(tags);
            });

        }else{
            alert("User is not in StackOverflow. Please, choose a Stack Overflow user");
            convertTags([]);
        }
    }

    /**
    * display information based on issues
    *
    * @param issue - Dictionary with id, title and body from github issue
    */
    $scope.getIssueTags = function (issue) {
        $location.search('issueId', issue._id);
        $scope.selectedIssue = issue;

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


    // *************** HELPER FUNCTIONS **************//

    /**
    * Gets the users and issues from the selected repository
    *
    * @param repo - The selected repository (id,name,language,description)
    */
    function getRepoInformation(repo) {
        $scope.repos = undefined;
        $scope.selectedRepo = repo;
        $location.search('repoName', repo.name);

        showLoadingScreen();
        getRepoResources('issues');
        getRepoResources('users');
        hideLoadingScreen();
    }

    function populateUserTags() {
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/user/:soId/tags/populate');
        var filter = {
            soId: $scope.selectedUser.soId
        }
        Resource.query(filter).$promise.then(function (response){
            hideLoadingScreen();
            convertTags(response);
        });

        Resource = $resource('/api/baseFrame/user/:_id/:soId/answers/populate');
        filter['_id'] = $scope.selectedUser._id;
        Resource.query(filter);
    }

    function convertTags(tags){
        tagsFromUserOnSO = {};
        $scope.selectedUser.emptyTags = false;
        for(var tag of tags){
            tagsFromUserOnSO[tag._id] = tag.count;
        }
        sendToGraph();
    }

    /**
    * Gets the github resources of the selected repository stored on the
    * database.
    *
    * @param resource - The desired resource for this repository (issues, users)
    */
    function getRepoResources(resource){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/:projectId/' + resource);
        Resource.query({projectId: $scope.selectedRepo._id})
          .$promise.then(function(resources){
            if(resources.length == 0){
                $scope.selectedRepo['empty' + resource] = true;
            }
            $scope[resource] = resources;
            hideLoadingScreen();
        });
    }

    function findProject(){
        var Project = $resource('/api/baseFrame/project/find/:name');
        var repoName = $location.search().repoName;
        if(repoName){
            Project.get({name: repoName}).$promise.then(function(project){
                getRepoInformation(project);
            });
        }
    }

    /**
    * Executes a populate request on the server
    *
    * @param url - The url to have populate the data
    */
    function populateRequest(url){
        showLoadingScreen();
        $http({
            method: 'POST',
            url: url,
            data: '',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success(function (response){
            hideLoadingScreen();
        });
    }

    function sendToGraph(){
        var graphs = new ExpertiseGraph();
        graphs.drawWithNewData(tagsFromIssue, tagsFromUserOnSO, $http);
    }
}]);
