(function () {
    'use strict';

    angular
        .module('app')
        .controller('resultsController', resultsController);

    resultsController.$inject = ['$rootScope', '$scope', '$http'];
    function resultsController($rootScope, $scope, $http) {
        var vm = this;

        var data = {
            userAuth : $rootScope.auth
        };
        $http.post('/surveysByUser', data)
            .success(function(data) {
                vm.surveys = data;
                for(var i=0; i<vm.surveys.length; i++) {
                    $http.get('/answerscount/' + vm.surveys[i].id)
                        .success(function(data) {
                            vm.surveys[i].answers = data;
                        })
                        .error(function(data) {
                            console.log('Error: ' + data);
                        });
                }
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    }

})();
