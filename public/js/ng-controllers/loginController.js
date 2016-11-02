(function () {
    'use strict';

    angular
        .module('app')
        .controller('loginController', loginController);

    loginController.$inject = ['$state', '$cookies', '$scope', '$http'];
    function loginController($state, $cookies, $scope, $http) {
        var vm = this;
        vm.user = {};
        vm.login = function (user) {
            $http.post('/login', user)
                .success(function(data) {
                    var now = new Date(),
                    // this will set the expiration to 10 years
                    exp = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
                    $cookies.putObject('loggedIn', true, {expires: exp});
                    $state.go('newSurvey');
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

    }

})();
