'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', ['$scope', function ($scope){

    $scope.populate = function(option){
        //TODO: Change this to resource instead of http!!
        var url = '/api/baseFrame/populate/' + option;
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

    $scope.export = function(option){
        //TODO: Change this to resource instead of http!!

    }
}]);
