'use strict';

angular.module('mean.expertise').config(['$stateProvider',
function ($stateProvider){
    $stateProvider.state('Import Data', {
        url: '/import',
        templateUrl: 'expertise/views/import.html'
    }).state('Export Data', {
        url: '/export',
        templateUrl: 'expertise/views/export.html'
    });
}]);
