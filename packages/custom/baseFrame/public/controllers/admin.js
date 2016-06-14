'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', function ($scope, $interval, $http){
    findProjects();
    $scope.selectedProject = undefined;

    $scope.populate = function(option){
        $scope.populateStatus = {
            option: option,
            linesRead: 0,
            started: true,
            completed: false,
            message: "This can take a while!"
        };
        var params = {
            params: {
                option: option,
                project: $scope.selectedProject
            }
        }
        $http.get('/api/baseFrame/populate', params)
        .then(function (response){
            checkPopulate(option);
        }, function(response){
            console.log(response);
        });
    }

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
            checkDownload(option);
        });
    }

    $scope.download = function(option){
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

    function checkPopulate(option){
        var delay = 5000;

        var interval = $interval(function () {
            var params = {
                params: {
                    resource: option,
                    populate: true
                }
            };

            $http.get('/api/baseFrame/check', params).then(function (response) {
                $scope.populateStatus.linesRead = response.data.linesRead;
                if(response.status == 200){
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(interval);
            $scope.populateStatus.completed = true;
        }
    }

    function checkDownload(option) {
        var delay = 1000;
        switch (option) {
            case 'Developer':
                delay = 50000;
            case 'Issue':
            case 'Commit':
                $scope.downloadStatus.message = "This will generate muliple files!";
                break;
        }

        var interval = $interval(function () {
            $http.get('/api/baseFrame/check', {params:{resource: option}})
            .then(function (response) {
                $scope.downloadStatus.linesRead = response.data.linesRead;
                if(response.status == 200){
                    $scope.downloadStatus.fileGenerated = true;
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(interval);
            $scope.download(option);
            if(option == 'Developer'){
                $scope.download('Question');
                $scope.download('Answer');
            } else if (option == 'Issue') {
                $scope.download('IssueComment');
            } else if (option == 'Commit') {
                $scope.download('CommitComment');
            }
            $scope.downloadStatus.started = true;
        }
    }

    function findProjects(){
        $http.get('api/baseFrame/project/find/').then(function (response){
            $scope.projects = response.data.projects;
        }, function (response){
            $scope.projects = undefined;
        })
    }
});
