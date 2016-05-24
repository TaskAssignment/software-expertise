'use strict';

//I still don't know how to connect this with the server routes.
angular.module('mean.baseFrame').config(['$stateProvider',
function ($stateProvider){
    $stateProvider.state('Expertise', {
        url: '/expertise',
        templateUrl: 'baseFrame/views/index.html'
    }).state('Admin Tasks', {
        url: '/admin',
        templateUrl: 'baseFrame/views/admin.html'
    });
}]);
