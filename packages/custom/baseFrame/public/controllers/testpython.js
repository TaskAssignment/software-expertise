'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('TestPythonController', function ($scope, $http, $location){

    $scope.generate = function (option) {
        $http.get('api/baseFrame/run/mozilla/aus')
        .then(function (response) {
          console.log(response);
        });
    }

    $scope.showservices = function (option) {
        $http.get('api/baseFrame/run/showservices')
        .then(function (response) {
          console.log(response);
        });
    }

    $scope.showprojects = function (option) {
        $http.get('api/baseFrame/run/showprojects/mozilla')
        .then(function (response) {
          console.log(response);
        });
    }
});
