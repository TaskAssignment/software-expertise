'use strict';
/**
 * Generates the expertise table
 **/

function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}
var controllerCallback = function ($scope, $resource, $uibModal) {
    $scope.assigneePosition = undefined

    var findMatches = function (event, params) {
        if(params.issueId){
            $scope.bestUsers = undefined;
            showLoadingScreen();
            var Match = $resource('api/baseFrame/find/:issueId/matches');

            Match.get(params).$promise.then(function (matches){
                $scope.bestUsers = matches.similarities;
                hideLoadingScreen();
            });
            $scope.selectedUsers = [];
        }
    }

    $scope.parameter = '-cosine';
    $scope.selectedUsers = [];
    $scope.comparison = false;

    $scope.selectUser = function (user){
        user.selected = !user.selected;
        if(user.selected){
            $scope.selectedUsers.push(user);
        } else {
            var index = $scope.selectedUsers.indexOf(user);
            $scope.selectedUsers.splice(index, 1);
        }
    }

    $scope.compare = function (value){
        $scope.comparison = value;
        if(!value){
            $scope.selectedUsers = [];
        }
    }

    $scope.sort = function(item){
        $scope.parameter = item;
    }

    $scope.$on('findMatches', findMatches);
}

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('TableController', controllerCallback);
