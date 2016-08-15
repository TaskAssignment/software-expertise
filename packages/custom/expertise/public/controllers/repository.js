'use strict';

function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}
var expertise = angular.module('mean.expertise');

var RepositoryController = function ($scope, $http, $location, $resource) {
    $scope.$on('projects', function (event, params) {
        $scope.projects = params;
    })
    // *************** SCOPE FUNCTIONS ***************//
    /**
    * display information based on issues
    *
    * @param issue - Dictionary with id, title and body from github issue
    **/
    $scope.selectIssue = function (issue) {
        $scope.selectedIssue = issue;
        sendToTable();
    }

    // *************** HELPER FUNCTIONS ***************//

    /**
    * Gets the users and issues from the selected repository
    *
    * @param repo - The selected repository (id,name,language,description)
    **/
    function getRepoInformation(repo) {
        $scope.selectedRepo = repo;
        $scope.search = false;
        $scope.repos = undefined;
        $scope.issues = [];
        $scope.selectedIssue = undefined;

        showLoadingScreen();
        getRepoResources('issues');
        hideLoadingScreen();
    }

    /**
    * Gets the github resources of the selected repository stored on the
    * database.
    *
    * @param resource - The desired resource for this repository (issues, users)
    **/
    function getRepoResources (resource){
        showLoadingScreen();
        var Resource = $resource('/api/expertise/:projectId/' + resource);
        var filter = {
            projectId: $scope.selectedRepo._id,
        };
        Resource.query(filter).$promise.then(function(resources){
            $scope.selectedRepo['empty' + resource] = false;
            $scope[resource] = resources;
            hideLoadingScreen();
        }, function(response){console.log(response)});
    }

    function findProject(){
        $scope.search = true;
        var Project = $resource('/api/expertise/project/get/:name');
        var repoName = $location.search().repoName;
        if(repoName){
            Project.get({name: repoName}).$promise.then(function(project){
                getRepoInformation(project);
            });
        }
    }

    function sendToTable(){
        hideLoadingScreen();
        var args = {};
        if($scope.selectedIssue){
            args.issueId = $scope.selectedIssue._id;
        }
        $scope.$broadcast('findMatches', args);
    }
}

expertise.controller('RepositoryController', RepositoryController);
