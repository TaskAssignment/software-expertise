'use strict';


function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', ['$scope', '$resource', '$http',
function ($scope, $resource, $http){

    $scope.populate = function(option){
        var Resource = $resource('/api/baseFrame/populate/' + option);

        Resource.get().$promise.then(function (response){
        }, function(response){console.log(response);});
    }

    $scope.export = function(option){
        $http.get('/api/baseFrame/export/' + option).then(function (response){
            alert("File is being created!");
        });
    }
}]);
