var expertise = angular.module('mean.expertise');
expertise.factory('searchProjects', function ($http, $rootScope, $location) {
    var projects = {
        gh: undefined,
        bz: undefined,
    }

    var findProjects = function (project, source) {
        var config = {
            params: {
                name: project,
                source: source,
            },
        }

        $http.get('/api/expertise/project/find', config).then(function (response) {
            projects[source] = response.data;
            $location.path('/');
            $rootScope.$broadcast('projects', projects);
        }, function (response) {
            console.log(response);
        });
    }

    return {
        findProjects: findProjects,
    }
})
