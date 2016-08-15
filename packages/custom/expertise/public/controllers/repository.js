'use strict';

var expertise = angular.module('mean.expertise');

var RepositoryController = function ($scope, $http, $location, $resource, screen) {
    $scope.$on('projects', function (event, params) {
        $scope.projects = params;
    });

    $scope.select = function (project, source) {
        $scope.project = project;
        $scope.projects = undefined;
        $scope.source = source;
        $scope.bugs = [];
        $scope.selectedBug = undefined;

        getRepoResources('bugs');
    }
    // *************** SCOPE FUNCTIONS ***************//
    /**
    * display information based on issues
    *
    * @param issue - Dictionary with id, title and body from github issue
    **/
    $scope.selectBug = function (bug) {
        $scope.selectedBug = bug;
        sendToTable();
    }

    // *************** HELPER FUNCTIONS ***************//

    /**
    * Gets the github resources of the selected repository stored on the
    * database.
    *
    * @param resource - The desired resource for this repository (issues, users)
    **/
    function getRepoResources (resource, source){
        screen.loading();
        var Resource = $resource('/api/expertise/:projectId/' + resource);
        var filter = {
            projectId: $scope.project._id,
            source: $scope.source,
        };
        Resource.query(filter).$promise.then(function(resources){
            $scope[resource] = resources;
            screen.ready();
        }, function(response){
            console.log(response);
            alert('Error! Contact the system administrator.');
            screen.ready();
        });
    }

    function sendToTable(){
        screen.ready();
        var args = {};
        if($scope.selectedBug){
            args.issueId = $scope.selectedBug._id;
            args.source = $scope.source;
        }
        $scope.$broadcast('findMatches', args);
    }
}

expertise.controller('RepositoryController', RepositoryController);
