'use strict';

angular.module('mean.expertise').controller('HeaderController',
  function ($scope, $http) {
    $scope.showBar = false;
    $scope.variables = {
        project: undefined,
    }

    $scope.projects = {
        gh: undefined,
        bz: undefined,
    }

    $scope.on = function () {
        $scope.showBar = true;
    }

    $scope.off = function () {
        $scope.showBar = false;
        findProjects('gh');
        findProjects('bz');
    }

    function findProjects(source){
        var config = {
            params: {
                name: $scope.variables.project,
                source: source,
            },
        }

        $http.get('/api/expertise/project/find', config).then(function (response) {
            $scope.projects[source] = response.data;
            console.log($scope.projects);
        }, function (response) {
            console.log(response);
        });
    }
});
