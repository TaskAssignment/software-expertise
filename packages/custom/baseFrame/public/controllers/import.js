'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ImportController', function ($scope, $interval, $http, $location){
    $scope.selected = undefined

    $scope.select = function (project) {
        console.log($scope.selected);
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

    function findProjects(){
        $http.get('api/baseFrame/project/find/').then(function (response){
            $scope.projects = response.data.projects;
        }, function (response){
            $scope.projects = undefined;
        })
    }

    $scope.sources = {
        file: {
            label: 'File',
            options: [ 'StopWords', 'CoOccurrences', 'Common Users'],
        },
        gh: {
            label: 'GitHub',
            options: [ 'Issues', 'Pull Requests', 'Events', 'Commits', 'Comments'],
        },
        so: {
            label: 'StackOverflow',
            options: [ 'Tags', 'Answers', 'Questions'],
        },
        bz: {
            label: 'Bugzilla',
            options: [ 'Bugs', 'Developers'],
        },
    }
});
