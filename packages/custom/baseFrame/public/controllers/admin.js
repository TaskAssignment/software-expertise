'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', ['$scope', '$resource', '$http',
function ($scope, $resource, $http){

    $scope.populate = function(option){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/populate/' + option);

        Resource.get().$promise.then(function (response){
            hideLoadingScreen();
        });
    }

    $scope.export = function(option){
        showLoadingScreen();
        $http.get('/api/baseFrame/export/' + option).then(function (response){
            hideLoadingScreen();
            alert("File downloaded!");
        });
    }
}]);
