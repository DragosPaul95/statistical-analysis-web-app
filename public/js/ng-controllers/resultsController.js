(function () {
    'use strict';

    angular
        .module('app')
        .controller('resultsController', resultsController);

    resultsController.$inject = ['$scope'];
    function resultsController($scope) {
        var vm = this;
    }

})();
