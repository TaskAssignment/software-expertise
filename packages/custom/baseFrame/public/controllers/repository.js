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

    $scope.selectTab = function (tab){
        angular.element('.tab').removeClass('active');
        angular.element('.tab-pane').addClass('hidden');

        angular.element(tab).addClass('active');
        angular.element(tab).removeClass('hidden');
    }

    $scope.fullPopulateRepo = function(){
        var items = [
            'languages',
            'commits',
            'issues/comments',
            'commits/comments',
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
        var Project = $resource('/api/baseFrame/project/new/');
        Project.get(repo).$promise.then(function(project){
            getRepoInformation(repo);
        });
    }


    $scope.populateRepoResources = function (resource){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/:projectId/populate/' + resource);
        var filter = {
            projectId: $scope.selectedRepo._id
        }
        Resource.get(filter).$promise.then(function (response){
            $scope.selectedRepo['empty' + resource] = false;
            hideLoadingScreen();
            getRepoInformation($scope.selectedRepo);
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
        $scope.selectedIssue = issue;

        //Any word from the issue that is an SO tag will be in this array.
        //This is the array that is sent to '/api/baseFrame/coOccurrence'
        showLoadingScreen();
        $http({
            method: 'POST',
            url: '/api/baseFrame/issueTags',
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
        var url = '/api/baseFrame/user/:soId/populate/';
        var Resource = $resource(url + 'answers');
        Resource.get(filter);

        Resource = $resource(url + 'questions');
        Resource.get(filter);

        Resource = $resource(url + 'tags');
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
        $scope.selectedRepo = repo;
        $scope.repos = undefined;
        $scope.users = [];
        $scope.issues = [];
        $scope.selectedUser = undefined;
        $scope.selectedIssue = undefined;

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
    function getRepoResources(resource, id = 0, order = '$gt'){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/:projectId/' + resource);
        var filter = {
            projectId: $scope.selectedRepo._id,
            order: order,
            id: id
        };
        Resource.query(filter).$promise.then(function(resources){
            if(resources.length == 0){
                $scope.selectedRepo['empty' + resource] = true;
            }

            //Add the last id to pagination later!
            $scope['last' + resource] = resources[resources.length - 1]._id
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
