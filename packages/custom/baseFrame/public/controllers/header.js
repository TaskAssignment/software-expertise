'use strict';

angular.module('mean.baseFrame').controller('MyHeaderController', ['$scope', '$rootScope', 'Menus', 'MeanUser', '$state',
  function($scope, $rootScope, Menus, MeanUser, $state) {

    var vm = this;

    vm.menus = {};

    vm.hdrvars = {
      authenticated: MeanUser.loggedin,
      user: MeanUser.user,
      isAdmin: MeanUser.isAdmin
    };

    /**
     * Default hard coded menu items for main menu
     */
    var defaultMainMenu = [];

    /**
     * Query menus added by modules. Only returns menus that user is allowed to see.
     * @see queryMenu in core
     */
    function queryMenu(name, defaultMenu) {

      Menus.query({
        name: name,
        defaultMenu: defaultMenu
      }, function(menu) {
        vm.menus[name] = menu;
        // vm.link[name] = link;
      });
    }

    /**
     * Query server for menus and check permissions
     * @see queryMenu in core
     */
    queryMenu('basemenu', defaultMainMenu);
   // queryMenu('admin', defaultMainMenu);
    queryMenu('account', []);


    $scope.isCollapsed = false;

    $rootScope.$on('loggedin', function() {
      queryMenu('basemenu', defaultMainMenu);
      //queryMenu('admin', defaultMainMenu);

      vm.hdrvars = {
        authenticated: MeanUser.loggedin,
        user: MeanUser.user,
        isAdmin: MeanUser.isAdmin
      };
    });

    vm.logout = function(){
      MeanUser.logout();
    };

    $rootScope.$on('logout', function() {
      vm.hdrvars = {
        authenticated: false,
        user: {},
        isAdmin: false
      };
      queryMenu('basemenu', defaultMainMenu);
     //queryMenu('admin', defaultMainMenu);
      $state.go('home');
    });

  }
]);
