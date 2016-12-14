(function () {
    'use strict';

    angular
        .module('app')
        .controller('loginController', loginController);

    loginController.$inject = ['$state', '$cookies', '$rootScope', '$location', '$http'];
    function loginController($state, $cookies, $rootScope, $location, $http) {
        var vm = this;
        if($rootScope.auth) $location.path('/results');
        vm.login = function (user) {
            $http.post('/login', user)
                .success(function(data) {
                    var now = new Date(),
                    // this will set the expiration to 10 years
                    exp = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());
                    $cookies.putObject('auth', data.auth, {expires: exp});
                    $state.go('newSurvey');
                })
                .error(function(data) {
                    vm.invalidAttempt = true;
                    console.log('Error: ' + data);
                });
        };

    }

})();
