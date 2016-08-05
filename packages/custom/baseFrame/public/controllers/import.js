'use strict';

var baseFrame = angular.module('mean.baseFrame');
baseFrame.controller('ImportController', function ($scope, $interval, $http, $location){
    $scope.selected = 'gh';
    $scope.project = undefined;
    $scope.bugzillaService = undefined;
    $scope.repoSearch = {
        name: '',
        user: '',
        description: '',
        readme: ''
    };

    /** Populate the given option on the database
    *
    * @param option {String} - one of the sources (file, gh, bz, so)
    **/
    $scope.populate = function (option) {
        var config = {
            params: {
                service: $scope.bugzillaService,
                project: $scope.project._id,
            }
        }
        console.log(option, config);
        $http.get('/api/baseFrame/populate/' + $scope.selected + '/' + option, config)
        .then(function (response){
            console.log(response);
        }, function(response){
            console.log(response);
        });
    }


    /** Looks for repositories with the given filters
     **/
    $scope.queryRepos = function () {
        var search = $scope.repoSearch;
        console.log(search);
        var URL = 'https://api.github.com/search/repositories?q=';
        if(search.user)
            URL += '+user:' + search.user;
        if(search.name)
            URL += ' ' + search.name + '+in:name';
        URL += '+fork:true&sort=stars&order=desc&per_page=100';

        $http.get(URL).then(function (response) {
            $scope.repos = response.data.items;
        }, function (response){
            console.log(response);
        });
    }

    $scope.saveProject = function(repo){
        $scope.project = {
            _id: repo.id,
            name: repo.full_name,
            language: repo.language,
        };

        var config = {
            params: $scope.project,
        }

        console.log(config.params);
        $http.get('/api/baseFrame/project/new/', config);
        $scope.repos = undefined;
    }

    /** Get the github projects on the database
    **/
    $scope.findProjects = function () {
        $scope.project = undefined;
        $scope.bugzillaService = undefined;
        $scope.bugzillaServices = undefined;
        $scope.projects = undefined;

        if($scope.selected === 'gh'){
            $http.get('api/baseFrame/project/find/').then(function (response) {
                $scope.projects = response.data.projects;
            }, function (response){
                $scope.projects = undefined;
            });
        } else if($scope.selected === 'bz'){
            $http.get('api/baseFrame/bugzilla/showservices/').then(function (response) {
                $scope.bugzillaServices = response.data;
            }, function (response){
                $scope.bugzillaServices = undefined;
                console.log(response);
            });
        }
    }

    $scope.findBugzillaProjects = function (service) {
        $scope.bugzillaService = service;
        $http.get('api/baseFrame/bugzilla/showprojects/' + service).then(function (response) {
            $scope.bugzillaProjects = response.data;
        }, function (response){
            $scope.bugzillaProjects = undefined;
            console.log(response);
        });
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
                    label: 'Bugs (contributors and bug history is also populated)',
                },
            ],
        },
    }
});
