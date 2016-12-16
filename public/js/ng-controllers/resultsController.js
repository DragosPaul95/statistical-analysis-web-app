(function () {
    'use strict';

    angular
        .module('app')
        .controller('resultsController', resultsController);

    resultsController.$inject = ['$rootScope', '$scope', '$http', "$location"];
    function resultsController($rootScope, $scope, $http, $location) {
        var vm = this;

        var data = {
            userAuth : $rootScope.auth
        };
        $http.post('/surveysByUser', data)
            .success(function(data) {
                vm.surveys = data;
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

    }

})();
