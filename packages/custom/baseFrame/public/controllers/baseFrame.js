'use strict';

var Ctrl = function($scope, Global, BaseFrame) {
    $scope.global = Global;
    $scope.package = {
        name: 'baseFrame'
    };
}

var BaseFrameController = ['$scope', 'Global', 'BaseFrame', Ctrl];

var mod = angular.module('mean.baseFrame');
mod.controller('BaseFrameController', BaseFrameController);
