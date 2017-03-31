(function () {
	'use strict';

	angular
		.module('app')
		.controller('registerController', registerController);

	registerController.$inject = ['$state', '$cookies', '$rootScope', '$location', '$http'];
	function registerController($state, $cookies, $rootScope, $location, $http) {
		var vm = this;

		vm.register = function (user) {
			$http.post('/register', user)
				.success(function(data) {
					delete vm.alreadyRegistered;
					if(data.msg) {
						vm.alreadyRegistered = data.msg;
						return;
					}
					vm.registerOk = true;
					setTimeout(function () {
                        $state.go("login");
					}, 2000);

				})
				.error(function(data) {
					delete vm.alreadyRegistered;
				});
		}
	}

})();
