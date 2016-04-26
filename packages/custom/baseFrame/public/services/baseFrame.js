// (function () {
//   'use strict';
//
//   angular
//     .module('mean.baseFrame')
//     .factory(BaseFrame);
//
//   BaseFrame.$inject = [];
//
//   function BaseFrame() {
//     return {
//       name: 'baseFrame'
//     };
//   }
// })();
angular.module('mean.baseFrame').factory('BaseFrame', [
  function() {
    return {
      name: 'baseFrame'
    };
  }
]);
