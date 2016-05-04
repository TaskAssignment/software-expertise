'use strict';

angular.module('mean.baseFrame').config(['$viewPathProvider', '$stateProvider',
  function($viewPathProvider, $stateProvider) {
    $viewPathProvider.
      override('system/views/index.html', 'baseFrame/views/index.html');
  }
]);
