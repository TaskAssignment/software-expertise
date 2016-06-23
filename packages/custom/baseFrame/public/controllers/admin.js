'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', function ($scope, $interval, $http, $location){
    findProjects();
    $scope.selectedProject = undefined;
    $scope.generalOptions = {
        StopWord: {
            label: 'StopWords',
            projectSpecific: false
        },
        Tag: {
            label: 'SO Tags',
            projectSpecific: false
        },
        CoOccurrence: {
            label: 'CoOccurrences',
            projectSpecific: false
        },
        Developer: {
            label: 'Common Users (SO/GH)',
            projectSpecific: false
        },
        Project: {
            label: 'Projects',
            projectSpecific: true
        },
        Contributor: {
            label: 'Contributors',
            projectSpecific: true
        },
        Answer: {
            label: 'SO Answers',
            projectSpecific: true
        },
        Question: {
            label: 'SO Questions',
            projectSpecific: true
        },
        Commit: {
            label: 'Commit',
            projectSpecific: true
        },
        CommitComment: {
            label: 'Commit Comments',
            projectSpecific: true
        },
        Issue: {
            label: 'Issues',
            projectSpecific: true
        },
        IssueEvent: {
            label: 'Issue Events',
            projectSpecific: true
        },
        IssueComment: {
            label: 'Issue Comments',
            projectSpecific: true
        },
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

    $scope.populate = function(option){
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
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            checkDownload(option);
        });
    }

    $scope.download = function(option){
        $scope.generalOptions[option].downloaded = false;
        if(option === 'Contributor'){
            $scope.generalOptions[option].downloaded = true;
            option = 'Developer';
        }
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

            $scope.generalOptions[option].downloaded = true;
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
