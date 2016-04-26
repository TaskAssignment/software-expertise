// (function () {
//   'use strict';
//
//   angular
//     .module('mean.baseFrame')
//     .config(baseFrame);
//
//   baseFrame.$inject = ['$viewPathProvider','$stateProvider'];
//
//   function baseFrame($viewPathProvider,$stateProvider) {
//     $stateProvider.state('baseFrame example page', {
//       url: '/baseFrame/example',
//       templateUrl: 'baseFrame/views/index.html'
//     });
//     $viewPathProvider.override('system/views/index.html','baseFrame/views/index.html')
//   }
//
// })();
'use strict';

angular.module('mean.baseFrame').config(['$viewPathProvider', '$stateProvider','$locationProvider',
  function($viewPathProvider, $stateProvider, $locationProvider) {
    $viewPathProvider.override('system/views/index.html', 'baseFrame/views/index.html');
    // $locationProvider.html5Mode(true);
    $stateProvider.state('tsv page', {
                url: '/tsv',
                templateUrl: 'baseFrame/views/tsv.html'
            }).state('defualts by id', {
               url: '/?repoId=',
               templateUrl: '/articles/views/view.html',
               requiredCircles : {
                 circles: ['authenticated'],
                 denyState: 'auth.login'
               }
             });;

  }
]);
