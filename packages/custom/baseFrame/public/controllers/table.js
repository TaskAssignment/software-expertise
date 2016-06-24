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
                $scope.assigneePosition = matches.assigneePosition;
                hideLoadingScreen();
            });
            $scope.selectedUsers = [];
        }
    }

    $scope.calculateMatchAverages = function (projectId) {
        if(projectId !== $scope.averages.project){
            showLoadingScreen();
            var MatchAverage = $resource('api/baseFrame/:projectId/calculate/matches/averages');

            MatchAverage.get({projectId: projectId}).$promise.then(function (result){
                $scope.averages = result.averages;
                console.log(result);
                $scope.averages.project = projectId;
                hideLoadingScreen();
            }, function (err){
                console.log(err);
                hideLoadingScreen();
            });
        } else {
            alert("This project already has the averages");
        }
    }

    $scope.averages = {
        project: undefined
    };

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

    $scope.compare = function (){
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'compare-table',
            controller: 'ModalController',
            size: 'lg',
            resolve: {
                users: function (){
                    return $scope.selectedUsers;
                }
            }
        });
    }

    $scope.sort = function(item){
        $scope.parameter = item;
    }

    $scope.$on('findMatches', findMatches);
}

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

angular.module('mean.baseFrame')
.controller('ModalController', function ($scope, $uibModalInstance, users) {
    $scope.users = users;

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.parameter = '-cosine';
    $scope.sort = function(item){
        $scope.parameter = item;
    }
});

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('TableController', controllerCallback);
