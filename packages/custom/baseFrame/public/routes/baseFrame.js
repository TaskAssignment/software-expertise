'use strict';

angular.module('mean.baseFrame').config(['$stateProvider',
function ($stateProvider){
    $stateProvider.state('Expertise', {
        url: '/expertise',
        templateUrl: 'baseFrame/views/index.html'
    }).state('Import Data', {
        url: '/import',
        templateUrl: 'baseFrame/views/import.html'
    }).state('Export Data', {
        url: '/export',
        templateUrl: 'baseFrame/views/export.html'
    });
}]);
