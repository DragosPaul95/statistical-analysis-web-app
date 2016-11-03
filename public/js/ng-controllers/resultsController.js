(function () {
    'use strict';

    angular
        .module('app')
        .controller('resultsController', resultsController);

    resultsController.$inject = ['$rootScope', '$scope'];
    function resultsController($rootScope, $scope) {
        var vm = this;
    }

})();
