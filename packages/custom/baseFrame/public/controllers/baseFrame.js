'use strict';

angular.module('mean.baseFrame').controller('BaseFrameController',
['$scope', 'Global', 'BaseFrame', function($scope, Global, BaseFrame) {
    $scope.global = Global;
    $scope.package = {
        name: 'baseFrame'
    };
}]);
