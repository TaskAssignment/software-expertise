'use strict';
/**
 * Class that handles drawing of the expertise graph
 **/

function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}
var controllerCallback = function ($scope, $resource) {
    $scope.assigneePosition = undefined

    var findMatches = function (event, params) {
        if(params.issueId){
            $scope.issueId = params.issueId;
            showLoadingScreen();
            var Match = $resource('api/baseFrame/find/:issueId/matches');

            Match.get(params).$promise.then(function (matches){
                $scope.bestUsers = matches.similarities;
                $scope.assignee = matches.assignee;
                hideLoadingScreen();
            });
        }
    }

    $scope.checkAssignee = function(isAssignee, index){
        if(isAssignee){
            $scope.assigneePosition = index + 1;
        }
        return isAssignee;
    }
    $scope.parameter = '-cosine';

    $scope.sort = function(item){
        $scope.parameter = item;
    }

    $scope.$on('findMatches', findMatches);
}

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('TableController', ['$scope', '$resource', controllerCallback]);
