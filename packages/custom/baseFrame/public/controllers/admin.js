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
        alert("File is being created!");
        showLoadingScreen();
        $http.get('/api/baseFrame/export/' + option).then(function (response){
            console.log(response);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var blob = new Blob([response.data], {type: "plain/text"}),
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = option + '.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            hideLoadingScreen();
        }, function (response) {
            hideLoadingScreen();
            console.log(response);
        });

    }
}]);
