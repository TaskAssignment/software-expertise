'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', function ($scope, $interval, $http, $location){
    findProjects();
    $scope.selectedProject = undefined;
    $scope.selectedPopulate = undefined;
    $scope.selectedExport = undefined;

    $scope.selectPopulate = function(option){
        $scope.selectedPopulate = option;
    }


    $scope.selectExport = function(option){
        $scope.selectedExport = option;
    }


    $scope.oauth = function () {
        var code = $location.search().code;
        $http.get('/api/baseFrame/oauth', {params: {code: code}})
        .then(function (response) {
            console.log(response.data);
        }, function (response){
            console.log(response);
        });
    }

    $scope.populateStatus = {};
    $scope.populate = function(option){
        $scope.populateStatus[option] = {
            linesRead: 0,
            completed: false,
            message: "This can take a while!"
        };
        $scope.selectedPopulate = option;

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

    $scope.exportStatus = {};
    $scope.generate = function (option) {
        $scope.exportStatus[option] = {
            fileGenerated: false,
            linesRead: 0,
            completed: false,
            message: ''
        };
        $scope.selectedExport = option;
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            $scope.exportStatus[option].fileRequested = true;
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
            $scope.exportStatus[option].completed = true;
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
                $scope.populateStatus[option].linesRead = response.data.linesRead;
                console.log(response);
                $scope.populateStatus[option].data = response.data;
                if(response.status == 200){
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(interval);
            $scope.populateStatus[option].completed = true;
        }
    }

    function checkDownload(option) {
        var delay = 1000;
        switch (option) {
            case 'Developer':
            case 'IssueEvent':
            case 'Commit':
                delay = 50000;
                $scope.exportStatus[option].message = "This will generate muliple files!";
                break;
        }

        var interval = $interval(function () {
            $http.get('/api/baseFrame/check', {params:{resource: option}})
            .then(function (response) {
                $scope.exportStatus[option].linesRead = response.data.linesRead;
                if(response.status == 200){
                    $scope.exportStatus[option].fileGenerated = true;
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
            } else if (option == 'IssueEvent') {
                $scope.download('IssueComment');
                $scope.download('Issue');
            } else if (option == 'Commit') {
                $scope.download('CommitComment');
            }
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
