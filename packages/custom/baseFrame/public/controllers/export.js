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
        Bug: {
            label: 'Bugs',
            description: 'GitHub Issues and their comments and history. Bugzilla Bugs, their comments and history (where it was able to fetch them). 6 files.',
        },
        PullRequest: {
            label: 'Pull Requests',
            description: 'GitHub Pull Requests with their comments and history. 3 files.',
        },
        Commit: {
            label: 'Commits',
            description: 'GitHub commits with their comments. 2 files.',
        },
        Project: {
            label: 'Projects',
            description: 'GitHub repositories and Bugzilla services. 2 files.',
        },
        Developer: {
            label: 'Developers',
            description: 'Information from StackOverflow, GitHub and Bugzilla profiles, answers and questions from StackOverflow. 3 files',
        },
        Meta: {
            label: 'Metadata',
            description: 'StackOverflow Tags and CoOccurrences, StopWords to analise text. 3 files.',
        },
    }
});
