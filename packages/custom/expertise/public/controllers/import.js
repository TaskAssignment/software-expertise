'use strict';

var expertise = angular.module('mean.expertise');
expertise.controller('ImportController', function ($scope, $interval, $http, $location){
    $scope.selected = 'file';
    $scope.project = undefined;
    $scope.bugzillaService = undefined;
    $scope.repoSearch = {
        name: '',
        user: '',
        searching: false,
    };

    /** Populate the given option on the database
    *
    * @param option {String} - one of the sources (file, gh, bz, so)
    **/
    $scope.populate = function (option) {
        $scope.sources[$scope.selected]['options'][option].populating = true;
        var config = {
            params: {
                service: $scope.bugzillaService,
            }
        }
        if($scope.selected === 'gh' || $scope.selected === 'bz'){
            config.params.project = $scope.project._id || $scope.project;
        }
        $http.get('/api/expertise/populate/' + $scope.selected + '/' + option, config)
        .then(function (response){
            config.params.source = $scope.selected;
            config.params.resource = option
            checkPopulate(config.params);
        }, function(response){
            console.log(response);
        });
    }


    /** Looks for repositories with the given filters
     **/
    $scope.queryRepos = function () {
        $scope.repoSearch.searching = true;
        var search = $scope.repoSearch;

        var URL = 'https://api.github.com/search/repositories?q=';
        if(search.user)
            URL += '+user:' + search.user;
        if(search.name)
            URL += ' ' + search.name + '+in:name';
        URL += '+fork:true&sort=stars&order=desc&per_page=100';

        $http.get(URL).then(function (response) {
            $scope.repos = response.data.items;
            $scope.repoSearch.searching = false;
        }, function (response){
            console.log(response);
            $scope.repoSearch.searching = false;
        });
    }

    $scope.saveProject = function(repo){
        $scope.project = {
            _id: repo.id,
            name: repo.full_name,
            language: repo.language,
            description: repo.description,
        };

        var config = {
            params: $scope.project,
        }

        $http.get('/api/expertise/project/new/', config);
        $scope.repos = undefined;
    }

    /** Get the github projects on the database
    **/
    $scope.findProjects = function () {
        $scope.project = undefined;
        $scope.bugzillaService = undefined;
        $scope.bugzillaServices = undefined;
        $scope.projects = undefined;

        if($scope.selected === 'bz'){
            $http.get('api/expertise/bugzilla/showservices/').then(function (response) {
                $scope.bugzillaServices = response.data;
            }, function (response){
                $scope.bugzillaServices = undefined;
                console.log(response);
            });
        }
    }

    $scope.findBugzillaProjects = function (service) {
        $scope.bugzillaService = service;
        $http.get('api/expertise/bugzilla/showprojects/' + service).then(function (response) {
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

    function checkPopulate(params){
        var checkInterval = setInterval(function () {
            $http.get('/api/expertise/populate/check', {
                params: params,
            })
            .then(function (response) {
                if(response.status === 200){
                    stopChecking();
                }

            }, function (response) {
                console.log(response);
                stopChecking();
            });
        }, 3000);

        function stopChecking() {
            clearInterval(checkInterval);
            $scope.sources[$scope.selected]['options'][params.resource].populating = false;
        }
    }

    $scope.sources = {
        file: {
            label: 'File',
            options: {
                StopWord: {
                    label: 'StopWords',
                    populating: false,
                },
                CoOccurrence: {
                    label: 'StackOverflow CoOccurrences',
                    populating: false,
                },
                CommonUser: {
                    label: 'StackOverflow and GitHub Common Users',
                    populating: false,
                },
            },
        },
        so: {
            label: 'StackOverflow',
            options: {
                Tag: {
                    label: 'Tags',
                    populating: false,
                },
            },
        },
        gh: {
            label: 'GitHub',
            options: {
                Issue: {
                    label: 'Issues and Pull Requests',
                    populating: false,
                },
                Event: {
                    label: 'Events',
                    populating: false,
                },
                Commit: {
                    label: 'Commits',
                    populating: false,
                },
                CommitComment: {
                    label: 'Commit Comments',
                    populating: false,
                },
                IssueComment: {
                    label: 'Issue/PR Comments',
                    populating: false,
                },
                Developer: {
                    label: 'Developers (and their StackOverflow answers, questions and tags)',
                    populating: false,
                }
            },
        },
        bz: {
            label: 'Bugzilla',
            options: {
                BugzillaBug: {
                    label: 'Bugs (contributors and bug history is also populated)',
                    populating: false,
                },
            },
        },
    }
});
