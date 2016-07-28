'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ExportController', function ($scope, $interval, $http, $location){
    getLastTimestamps();

    $scope.generate = function (option) {
        $scope.generalOptions[option].generated = false;
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            checkGenerate(option);
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
            var a = document.createElement('a');
            a.style = 'display: none';
            var blob = new Blob([response.data], {type: 'plain/text'}),
            url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = option + 's.tsv';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            $scope.generalOptions[option].downloaded = true;
        }, function (response) {
            console.log(response);
        });
    }

    function checkGenerate(option) {
        var delay = 5000;

        var interval = $interval(function () {
            $http.get('/api/baseFrame/check', {params:{resource: option}})
            .then(function (response) {
                if(response.status === 200){
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(interval);
            getLastTimestamps();
            $scope.generalOptions[option].generated = true;
        }
    }

    function getLastTimestamps(){
        $http.get('api/baseFrame/timestamps').then(function (response){
            for(var model in response.data){
                $scope.generalOptions[model].timestamp = new Date(response.data[model]).toLocaleString();
            }
        }, function (response){
            console.log(response);
        });
    }

    $scope.generalOptions = {
        StopWord: {
            label: 'StopWords',
            noModel: false,
        },
        Tag: {
            label: 'SO Tags',
            noModel: false,
        },
        CoOccurrence: {
            label: 'CoOccurrences',
            noModel: false,
        },
        Developer: {
            label: 'Common Users (SO/GH)',
            noModel: false,
        },
        Project: {
            label: 'Projects',
            noModel: false,
        },
        Contributor: {
            label: 'Contributors',
            noModel: false,
        },
        Answer: {
            label: 'SO Answers',
            noModel: true,
            parent: 'Contributor',
        },
        Question: {
            label: 'SO Questions',
            noModel: true,
            parent: 'Contributor',
        },
        Commit: {
            label: 'Commit',
            noModel: false,
        },
        CommitComment: {
            label: 'Commit Comments',
            noModel: false,
        },
        Bug: {
            label: 'Issues',
            noModel: false,
        },
        PullRequest: {
            label: 'Pull Requests',
            noModel: true,
            parent: 'Issues',
        },
        Event: {
            label: 'Issue Events',
            noModel: false,
        },
        IssueComment: {
            label: 'Issue Comments',
            noModel: false,
        },
    }
});
