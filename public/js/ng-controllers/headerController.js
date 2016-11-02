(function () {
    'use strict';

    angular
        .module('app')
        .controller('headerController', headerController);

    headerController.$inject = ['$location', '$cookies', '$scope', '$rootScope'];
    function headerController($location, $cookies, $scope, $rootScope) {
        var headerVm = this;
        headerVm.user = {};
        headerVm.logout = function () {
            $cookies.remove('loggedIn');
            $rootScope.isLoggedIn = false;
            $location.path('/login');
        }

    }

})();
