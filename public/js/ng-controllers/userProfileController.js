(function () {
    'use strict';

    angular
        .module('app')
        .controller('userProfileController', userProfileController);

    userProfileController.$inject = ['$rootScope', '$scope', '$state', '$http', '$stateParams'];
    function userProfileController($rootScope, $scope, $state, $http, $stateParams) {

        (function initController() {
            $http({
                method: 'GET',
                url: "/user/" + $rootScope.auth.userId
            }).then(function successCallback(response) {
                $scope.user = response.data[0];
            }, function errorCallback(response) {
            });
        })();

        $scope.editProfile = function (user) {
            user.user_id = $rootScope.auth.userId;
            $http({
                method: 'POST',
                url: "/user/" + $rootScope.auth.userId,
                data: user
            }).then(function successCallback(response) {
                alert("ok");
            }, function errorCallback(response) {
                alert("err");
            });
        }
    }


})();
