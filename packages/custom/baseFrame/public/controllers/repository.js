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

    $scope.populate = function(option){
        //TODO: Change this to resource instead of http!!
        var url = '/api/baseFrame/populate' + option;
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

    $scope.fullPopulateRepo = function(){
        var items = [
            'issues/comments',
            'commits/comments',
            'commits',
        ]

        for(var item of items){
            showLoadingScreen();
            var Resource = $resource('/api/baseFrame/:projectId/populate/' +
                item);
            var filter = {
                projectId: $scope.selectedRepo._id
            }
            Resource.get(filter).$promise.then(function (response){
                hideLoadingScreen();
            });
        }

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
        URL += '+fork:true&sort=stars&order=desc&per_page=100';

        $http.get(URL).then(function (response) {
            var results = response.data.items;
            console.log(response.headers);
            // TODO: Figure out how to get next items

            var repos = [];
            console.log(results[0]);
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
        $scope.selectedUser = user;

        if(!user.soId){
            alert("User is not in StackOverflow. Please, choose a Stack Overflow user");
        }
        convertTags(user.tags);
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

    $scope.populateSOData = function() {
        showLoadingScreen();
        var filter = {
            soId: $scope.selectedUser.soId,
        }

        var Resource = $resource('/api/baseFrame/user/:soId/answers/populate');
        Resource.get(filter);

        Resource = $resource('/api/baseFrame/user/:soId/questions/populate');
        Resource.get(filter);

        Resource = $resource('/api/baseFrame/user/:soId/tags/populate');
        Resource.get(filter).$promise.then(function (user){
            hideLoadingScreen();
            $scope.selectedUser = user;
            convertTags(user.tags);
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

    function sendToGraph(){
        var graphs = new ExpertiseGraph();
        graphs.drawWithNewData(tagsFromIssue, tagsFromUserOnSO, $http);
    }
}]);
