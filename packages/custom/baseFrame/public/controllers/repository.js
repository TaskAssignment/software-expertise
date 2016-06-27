'use strict';

function showLoadingScreen(){
    angular.element('#loadingImage').css('display','block');
}

function hideLoadingScreen(){
    angular.element('#loadingImage').css('display','none');
}
var baseFrame = angular.module('mean.baseFrame');

var RepositoryController = function ($scope,  $http, $location, $resource) {
    $scope.repoSearch = {
        name: '',
        user: '',
        description: '',
        readme: ''
    };
    findProject();

    // *************** SCOPE FUNCTIONS ***************//

    /** Looks for repositories with the given filters
     **/
    $scope.queryRepos = function () {
        var search = $scope.repoSearch;
        showLoadingScreen();
        var URL = 'https://api.github.com/search/repositories?q=';
        if(search.user)
            URL += '+user:' + search.user;
        if(search.name)
            URL += search.name + '+in:name';
        if(search.description)
            URL += '+' + search.description + '+in:description';
        if(search.readme)
            URL += '+' + search.readme + '+in:readme';
        URL += '+fork:true&sort=stars&order=desc&per_page=100';

        $http.get(URL).then(function (response) {
            var results = response.data.items;

            var repos = [];
            for (var i in results) {
                var result = results[i];
                var repo = {
                    name: result.full_name,
                    _id: result.id,
                    language: result.language,
                    description: result.description
                };
                repos.push(repo);
            }
            $scope.repos = repos;
            hideLoadingScreen();
        }, function (response){
            hideLoadingScreen();
        });
    }

    $scope.saveProject = function(repo){
        var Project = $resource('/api/baseFrame/project/new/');
        Project.get(repo).$promise.then(function(project){
            getRepoInformation(repo);
        });
    }

    /**
    * display information based on issues
    *
    * @param issue - Dictionary with id, title and body from github issue
    **/
    $scope.selectIssue = function (issue) {
        $scope.selectedIssue = issue;
        sendToTable();
    }

    // *************** HELPER FUNCTIONS ***************//

    /**
    * Gets the users and issues from the selected repository
    *
    * @param repo - The selected repository (id,name,language,description)
    **/
    function getRepoInformation(repo) {
        $scope.selectedRepo = repo;
        $scope.search = false;
        $scope.repos = undefined;
        $scope.issues = [];
        $scope.selectedIssue = undefined;

        $location.search('repoName', repo.name);

        showLoadingScreen();
        getRepoResources('issues');
        hideLoadingScreen();
    }

    /**
    * Gets the github resources of the selected repository stored on the
    * database.
    *
    * @param resource - The desired resource for this repository (issues, users)
    **/
    function getRepoResources (resource){
        showLoadingScreen();
        var Resource = $resource('/api/baseFrame/:projectId/' + resource);
        var filter = {
            projectId: $scope.selectedRepo._id,
        };
        Resource.query(filter).$promise.then(function(resources){
            $scope.selectedRepo['empty' + resource] = false;
            $scope[resource] = resources;
            hideLoadingScreen();
        }, function(response){console.log(response)});
    }

    function findProject(){
        $scope.search = true;
        var Project = $resource('/api/baseFrame/project/get/:name');
        var repoName = $location.search().repoName;
        if(repoName){
            Project.get({name: repoName}).$promise.then(function(project){
                getRepoInformation(project);
            });
        }
    }

    function sendToTable(){
        hideLoadingScreen();
        var args = {};
        if($scope.selectedIssue){
            args.issueId = $scope.selectedIssue._id;
        }
        $scope.$broadcast('findMatches', args);
    }
}

baseFrame.controller('RepositoryController', RepositoryController);
