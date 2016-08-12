'use strict';

angular.module('mean.expertise').controller('HeaderController',
  function ($scope, $http) {
    $scope.showBar = false;
    $scope.variables = {
        project: undefined,
    }


    $scope.countries = [
        { name:'mozilla/firefox'},
        { name:'mozilla/firefox-for-ios'},
        { name:'eclipse/birt'},
        { name:'rails/rails'},
        { name:'django/django'},
        { name:'eclipse/BIRT'},
    ];

    $scope.selectedCountry = $scope.countries[0]
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
            $scope.$broadcast('projects', response.data);
        }, function (response) {
            console.log(response);
        });
    }
});
