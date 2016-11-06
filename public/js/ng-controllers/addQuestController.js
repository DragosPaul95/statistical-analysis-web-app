(function () {
    'use strict';

    angular
        .module('app')
        .controller('addQuestController', addQuestController);

    addQuestController.$inject = ['$rootScope', '$scope', '$http', 'Flash'];
    function addQuestController($rootScope, $scope, $http, Flash) {
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
            var data = {
                userId:  $rootScope.auth.userId,
                survey: vm.survey
            };
            $http.post('/savesurvey', data)
                .success(function(data) {
                    console.log(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        };

    }

})();
