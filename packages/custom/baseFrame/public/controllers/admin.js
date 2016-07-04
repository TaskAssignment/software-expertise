'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('AdminController', function ($scope, $interval, $http, $location){
    findProjects();
    getLastTimestamps();
    $scope.selectedProject = undefined;
    $scope.generalOptions = {
        StopWord: {
            label: 'StopWords',
            projectSpecific: false,
            noModel: false,
        },
        Tag: {
            label: 'SO Tags',
            projectSpecific: false,
            noModel: false,
        },
        CoOccurrence: {
            label: 'CoOccurrences',
            projectSpecific: false,
            noModel: false,
        },
        Developer: {
            label: 'Common Users (SO/GH)',
            projectSpecific: false,
            noModel: false,
        },
        Project: {
            label: 'Projects',
            projectSpecific: true,
            noModel: false,
        },
        Contributor: {
            label: 'Contributors',
            projectSpecific: true,
            noModel: false,
        },
        Answer: {
            label: 'SO Answers',
            projectSpecific: true,
            noModel: true,
            parent: 'Contributor',
        },
        Question: {
            label: 'SO Questions',
            projectSpecific: true,
            noModel: true,
            parent: 'Contributor',
        },
        Commit: {
            label: 'Commit',
            projectSpecific: true,
            noModel: false,
        },
        CommitComment: {
            label: 'Commit Comments',
            projectSpecific: true,
            noModel: false,
        },
        Bug: {
            label: 'Issues',
            projectSpecific: true,
            noModel: false,
        },
        PullRequest: {
            label: 'Pull Requests',
            projectSpecific: true,
            noModel: false,
        },
        Event: {
            label: 'Issue Events',
            projectSpecific: true,
            noModel: false,
        },
        IssueComment: {
            label: 'Issue Comments',
            projectSpecific: true,
            noModel: false,
        },
    }
    $scope.clientIds = [7211, 7341, 7342, 7343, 7344];

    $scope.select = function (project) {
        console.log(project);
        $scope.selectedProject = project
    }

    $scope.projectSelected = function () {
        return $scope.selectedProject;
    }

    $scope.oauth = function (id) {
        var code = $location.search().code;
        $http.get('/api/baseFrame/oauth', {params: {code: code, client_id: id}})
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
            document.body.appendChild(a);
            a.style = 'display: none';
            var blob = new Blob([response.data], {type: 'plain/text'}),
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
        $scope.generalOptions[option].populated = false;

        var interval = $interval(function () {
            var params = {
                params: {
                    resource: option,
                    populate: true
                }
            };

            $http.get('/api/baseFrame/check', params).then(function (response) {
                if(response.status === 200){
                    stop();
                }
            })
        }, delay);

        function stop(){
            $interval.cancel(interval);
            $scope.generalOptions[option].populated = true;

        }
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

    function findProjects(){
        $http.get('api/baseFrame/project/find/').then(function (response){
            $scope.projects = response.data.projects;
        }, function (response){
            $scope.projects = undefined;
        })
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
});
