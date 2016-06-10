'use strict';

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

    $scope.downloadStatus = {
        option: undefined,
        fileRequested: false,
        fileGenerated: false,
        linesRead: 0,
        started: false,
        completed: false,
        message: ''
    };

    $scope.populateStatus = undefined;

    $scope.generate = function (option) {
        $scope.downloadStatus = {
            option: option,
            fileRequested: false,
            fileGenerated: false,
            linesRead: 0,
            started: false,
            completed: false,
            message: ''
        };
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            $scope.downloadStatus.fileRequested = true;
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
            $scope.downloadStatus.completed = true;
        }, function (response) {
            console.log(response);
        });
    }

    function check(option) {
        var delay = 1000;
        if(option == 'Developer'){
            $scope.downloadStatus.message = "This will generate muliple files!";
            delay = 5000;
        }

        var check = $interval(function () {
            $http.get('/api/baseFrame/check', {params:{resource: option}})
            .then(function (response) {
                console.log(response);
                $scope.downloadStatus.linesRead = response.data.linesRead;
                if(response.status == 200){
                    $scope.downloadStatus.fileGenerated = response.data.ready;
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(check);
            $scope.download(option);
            if(option == 'Developer'){
                $scope.download('Question');
                $scope.download('Answer');
            }
            $scope.downloadStatus.started = true;
        }
    }
});
