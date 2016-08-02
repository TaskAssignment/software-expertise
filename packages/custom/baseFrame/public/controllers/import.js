'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ImportController', function ($scope, $interval, $http, $location){
    $scope.selected = 'file';
    $scope.project = undefined;

    /** Populate the given option on the database
    *
    * @param option {String} - one of the sources (file, gh, bz, so)
    **/
    $scope.populate = function (option) {
        var config = {
            params: {
                project: $scope.project,
            }
        }
        $http.get('/api/baseFrame/populate/' + $scope.selected + '/' + option, config)
        .then(function (response){
            console.log(response);
        }, function(response){
            console.log(response);
        });
    }

    /** Get the github projects on the database
    **/
    $scope.findProjects = function () {
        $scope.project = undefined;
        if($scope.selected === 'gh'){
            $http.get('api/baseFrame/project/find/').then(function (response){
                $scope.projects = response.data.projects;
            }, function (response){
                $scope.projects = undefined;
            });
        }
    }

    /** Marks a project to populate
    *
    * @param {String} project - The project id (github and this database)
    **/
    $scope.selectProject = function (project) {
        $scope.project = project;
    }

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
                    label: 'Issues and Pull Requests',
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
                }, {
                    key: 'Developer',
                    label: 'Developers (and their StackOverflow answers, questions and tags)'
                }
            ],
        },
        so: {
            label: 'StackOverflow',
            options: [
                {
                    key: 'Tag',
                    label: 'Tags',
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
