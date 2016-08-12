'use strict';

var Ctrl = function($scope, Global, Expertise) {
    $scope.global = Global;
    $scope.package = {
        name: 'expertise'
    };
}

var ExpertiseController = ['$scope', 'Global', 'Expertise', Ctrl];

var mod = angular.module('mean.expertise');
mod.controller('ExpertiseController', ExpertiseController);


angular.module('mean.expertise', ['mean.system'])
.config(['$viewPathProvider', function($viewPathProvider) {
  $viewPathProvider.override('system/views/index.html', 'expertise/views/index.html');
  $viewPathProvider.override('system/views/header.html', 'expertise/views/header.html');
}]);
