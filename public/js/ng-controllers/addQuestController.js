(function () {
    'use strict';

    angular
        .module('app')
        .controller('addQuestController', addQuestController);

    addQuestController.$inject = ['$scope', '$http'];
    function addQuestController($scope, $http) {
        $scope.survey = {};
        $scope.addSurvey = function (surveyObject) {
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
