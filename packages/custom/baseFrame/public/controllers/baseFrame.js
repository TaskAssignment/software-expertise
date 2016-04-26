// 'use strict';
//
// /* jshint -W098 */
// function () {
'use strict';

/* jshint -W098 */
angular.module('mean.baseFrame').controller('BaseFrameController', ['$scope', 'Global', 'BaseFrame',
function($scope, Global, BaseFrame) {
  $scope.global = Global;
  $scope.package = {
    name: 'baseFrame'
  };
  }
]);
//   angular
//     .module('mean.baseFrame')
//     .controller('BaseFrameController', BaseFrameController);
//
//   BaseFrameController.$inject = ['$scope', 'Global', 'BaseFrame'];
//
//   function BaseFrameController($scope, Global, BaseFrame) {
//     $scope.global = Global;
//     $scope.package = {
//       name: 'baseFrame'
//     };
//   }
// })();
