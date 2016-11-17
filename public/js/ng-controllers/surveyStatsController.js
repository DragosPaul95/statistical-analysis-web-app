(function () {
    'use strict';

    angular
        .module('app')
        .controller('surveyStatsController', surveyStatsController);

    surveyStatsController.$inject = ['$rootScope', '$scope', '$http'];
    function surveyStatsController($rootScope, $scope, $http) {
        var vm = this;

    }

})();
