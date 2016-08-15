'use strict';

angular.module('mean.expertise').controller('HeaderController',
  function ($scope, $http, $location, searchProjects) {
    $scope.showBar = false;
    $scope.variables = {
        project: undefined,
    }

    $scope.on = function () {
        $scope.showBar = true;
    }

    $scope.off = function () {
        $scope.showBar = false;
        searchProjects.findProjects($scope.variables.project, 'gh');
        searchProjects.findProjects($scope.variables.project, 'bz');
    }
});
