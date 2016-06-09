'use strict';


function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', function ($scope, $interval, $http){

    $scope.populate = function(option){
        $http.get('/api/baseFrame/populate', {params:{resources: option}})
        .then(function (response){
            console.log(response);
        }, function(response){
            console.log(response);
        });
    }

    $scope.downloadStatus = undefined;

    $scope.generate = function (option) {
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            $scope.downloadStatus = "We are generating the file. We will download it once it's ready";
            check(option);
        });
    }

    $scope.download = function(option){
        showLoadingScreen();
        $http.get('/api/baseFrame/download', {params:{resource: option}})
        .then(function (response) {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            var blob = new Blob([response.data], {type: "plain/text"}),
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = option + 's.tsv';
            a.click();
            window.URL.revokeObjectURL(url);
            hideLoadingScreen();
        }, function (response) {
            hideLoadingScreen();
            console.log(response);
        });
    }

    function check(option) {
        var counter = 1;
        var delay = 1000;
        if(option == 'Developer'){
            $scope.downloadStatus += " This will generate muliple files!"
        } else if (option == 'CoOccurrence') {
            delay = 100000;
        }

        var check = $interval(function () {
            $http.get('/api/baseFrame/check', {params:{resource: option}})
            .then(function (response) {
                console.log(counter);
                counter++;
                if(response.status == 200){
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(check);
            $scope.downloadStatus = "Success"
            $scope.download(option);
            if(option == 'Developer'){
                $scope.download('Question');
                $scope.download('Answer');
            }
        }
    }
});
