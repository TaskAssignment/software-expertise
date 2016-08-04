'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ExportController', function ($scope, $interval, $http){

    $scope.generate = function (option) {
        $scope.options[option].generated = false;
        $http.get('/api/baseFrame/generate', {params:{resource: option}});
    }

    $scope.download = function(option){
        $scope.options[option].downloaded = false;
        $http.get('/api/baseFrame/download', {
            params: {
                resource: option,
            },
            responseType: 'blob',
        })
        .then(function (response) {
            var blob = new Blob([response.data], {type: 'application/zip'});
            //saveAs defined in assets/js/FileSaver.js
            saveAs(blob, 'teste.zip');
            $scope.options[option].downloaded = true;
        }, function (response) {
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
