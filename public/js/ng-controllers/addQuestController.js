(function () {
    'use strict';

    angular
        .module('app')
        .controller('addQuestController', addQuestController);

    addQuestController.$inject = ['$rootScope', '$scope', '$http'];
    function addQuestController($rootScope, $scope, $http) {
        var vm = this;
        vm.survey = {};
        vm.survey.questions = [];
        vm.addChoice = function (qid, test) {
            var question = vm.survey.questions.filter(function(question) {
                return question.id == qid;
            })[0].choices;
            question.push({
                value: test? test.value : null,
                label: test? test.label : null
            });
        };

        (vm.addQcard = function () {
            vm.survey.questions.push({
                id: "q" + vm.survey.questions.length
            });
            vm.survey.questions[vm.survey.questions.length - 1].choices = [];
            vm.addChoice("q" + (vm.survey.questions.length-1), null);

        })();


        vm.addSurvey = function () {
            if(vm.survey.survey_private === undefined) {
                vm.survey.survey_private = 0;
            }
            var data = {
                userAuth:  $rootScope.auth,
                survey: vm.survey
            };
            $http.post('/savesurvey', data)
                .success(function(data) {
                   vm.saveOk = true;
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                    vm.saveOk = false;
                });
        };

    }

})();
