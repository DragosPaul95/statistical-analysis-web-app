(function () {
    'use strict';

    angular
        .module('app')
        .controller('addQuestController', addQuestController);

    addQuestController.$inject = ['$scope', '$http', 'Flash'];
    function addQuestController($scope, $http, Flash) {
        var vm = this;
        vm.survey = {};
        vm.addSurvey = function (surveyObject) {
            $http.post('/savesurvey', surveyObject)
                .success(function(data) {
                    console.log(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

    }

})();
