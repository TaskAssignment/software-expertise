'use strict';

angular.module('mean.system').controller('HeaderController', ['$scope', '$rootScope', 'Menus', '$state',
  function($scope, $rootScope, Menus, $state) {

    var vm = this;

    vm.menus = {};

    // Default hard coded menu items for main menu
    var defaultMainMenu = [];

    /**
     * Query menus added by modules. Only returns menus that user is allowed to see.
     *
     * @param name
     * @param defaultMenu
     */
    function queryMenu(name, defaultMenu) {

      Menus.query({
        name: name,
        defaultMenu: defaultMenu
      }, function(menu) {
        vm.menus[name] = menu;
      });
    }

    /**
     * Query server for menus and check permissions
     */
    queryMenu('main', defaultMainMenu);
    queryMenu('account', []);


    $scope.isCollapsed = false;


    $rootScope.$on('logout', function() {
      vm.hdrvars = {
        authenticated: false,
        user: {},
        isAdmin: false
      };
      queryMenu('main', defaultMainMenu);
      $state.go('home');
    });

  }
]);
