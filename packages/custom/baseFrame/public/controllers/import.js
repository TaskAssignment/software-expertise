'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ImportController', function ($scope, $interval, $http, $location){
    $scope.selected = 'file';
    $scope.project = undefined;

    $scope.populate = function (option) {
        console.log($scope.selected, $scope.project);
        // $http.get('/api/baseFrame/populate/' + $scope.selected + '/' + option)
        // .then(function (response){
        //     console.log(response);
        // }, function(response){
        //     console.log(response);
        // });
    }

    $scope.findProjects = function () {
        if($scope.selected === 'gh'){
            $http.get('api/baseFrame/project/find/').then(function (response){
                $scope.projects = response.data.projects;
            }, function (response){
                $scope.projects = undefined;
            });
        }
    }

    $scope.selectProject = function (project) {
        $scope.project = project;
    }
    // function checkPopulate(option){
    //     var delay = 5000;
    //     $scope.generalOptions[option].populated = false;
    //
    //     var interval = $interval(function () {
    //         var params = {
    //             params: {
    //                 resource: option,
    //                 populate: true
    //             }
    //         };
    //
    //         $http.get('/api/baseFrame/check', params).then(function (response) {
    //             if(response.status === 200){
    //                 stop();
    //             }
    //         })
    //     }, delay);
    //
    //     function stop(){
    //         $interval.cancel(interval);
    //         $scope.generalOptions[option].populated = true;
    //
    //     }
    // }
    //

    $scope.sources = {
        file: {
            label: 'File',
            options: [
                {
                    key: 'StopWord',
                    label: 'StopWords',
                }, {
                    key: 'CoOccurrence',
                    label: 'StackOverflow CoOccurrences',
                }, {
                    key: 'CommonUser',
                    label: 'StackOverflow and GitHub Common Users',
                },
            ],
        },
        gh: {
            label: 'GitHub',
            options: [
                {
                    key: 'Issue',
                    label: 'Issues',
                }, {
                    key: 'PullRequest',
                    label: 'Pull Requests',
                }, {
                    key: 'Event',
                    label: 'Events',
                }, {
                    key: 'Commit',
                    label: 'Commits',
                }, {
                    key: 'CommitComment',
                    label: 'Commit Comments',
                }, {
                    key: 'IssueComment',
                    label: 'Issue/PR Comments',
                },
            ],
        },
        so: {
            label: 'StackOverflow',
            options: [
                {
                    key: 'Tag',
                    label: 'Stack Overflow Tags',
                }, {
                    key: 'Answer',
                    label: 'Answers',
                }, {
                    key: 'Question',
                    label: 'Questions',
                },
            ],
        },
        bz: {
            label: 'Bugzilla',
            options: [
                {
                    key: 'BugzillaBug',
                    label: 'Bugs',
                }, {
                    key: 'BugzillaProfile',
                    label: 'Developers',
                },
            ],
        },
    }
});
