(function () {
    'use strict';

    angular
        .module('app')
        .controller('multicriterialAnalysisController', multicriterialAnalysisController);

    multicriterialAnalysisController.$inject = ['$stateParams', '$scope', '$http'];
    function multicriterialAnalysisController($stateParams, $scope, $http) {
        var vm = this;

        $http({
            method: 'GET',
            url: '/getSurvey/' + $stateParams.surveyID
        }).then(function successCallback(response) {
            vm.survey = response.data;
            vm.choicesString = [];
            for(var i = 0; i < vm.survey.questions.length; i++) {
                var question = vm.survey.questions[i];
                var choicesString = "";
                for(var ii=0;ii<question.question_choices.length;ii++) {
                    var choice = question.question_choices[ii];
                    choicesString += choice.choice_label + " || ";
                }
                vm.choicesString.push(choicesString);
            }
        }, function errorCallback(response) {

        });
        $http({
            method: 'GET',
            url: '/multianalysis/' + $stateParams.surveyID
        }).then(function successCallback(response) {
            vm.mcStats = response.data;
        }, function errorCallback(response) {
            console.log('Error: ' + response);
        });

    }

})();
