'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ExportController', function ($scope, $interval, $http, $location){
    getLastTimestamps();

    $scope.generate = function (option) {
        $scope.options[option].generated = false;
        $http.get('/api/baseFrame/generate', {params:{resource: option}})
        .then(function (response) {
            checkGenerate(option);
        });
    }

    $scope.download = function(option){
        $scope.options[option].downloaded = false;
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

            $scope.options[option].downloaded = true;
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
            $scope.options[option].generated = true;
        }
    }

    function getLastTimestamps(){
        $http.get('api/baseFrame/timestamps').then(function (response){
            for(var model in response.data){
                if($scope.options.hasOwnProperty(model)){
                    $scope.options[model].timestamp =
                    new Date(response.data[model]).toLocaleString();
                }
            }
        }, function (response){
            console.log(response);
        });
    }

    $scope.options = {
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
        Project: {
            label: 'Projects',
            noModel: false,
        },
        Developer: {
            label: 'Developers',
            noModel: false,
        },
        Answer: {
            label: 'SO Answers',
            noModel: true,
            parent: 'Developer',
        },
        Question: {
            label: 'SO Questions',
            noModel: true,
            parent: 'Developer',
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
