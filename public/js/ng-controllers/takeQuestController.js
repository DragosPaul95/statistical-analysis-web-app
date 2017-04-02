(function () {
    'use strict';

    angular
        .module('app')
        .controller('takeQuestController', takeQuestController);

    takeQuestController.$inject = ['$rootScope', '$scope', '$state', '$http', '$stateParams'];
    function takeQuestController($rootScope, $scope, $state, $http, $stateParams) {
        var vm = this;
        vm.surveyID = $stateParams.surveyID;
        $http({
            method: 'GET',
            url: '/getSurvey/'+vm.surveyID
        }).then(function successCallback(response) {

            if( (response.data.survey_private && $rootScope.auth) || !response.data.survey_private) {
                vm.survey = response.data;
                vm.surveyAnswers = {};
            }
            else {
                $state.go('login');
            }

        }, function errorCallback(response) {
            console.log('Error: ' + response);
        });

        vm.addSelection = function (qid, value) {
            if(!vm.surveyAnswers[qid]) {
                vm.surveyAnswers[qid] = value;
            }
            else {
                vm.surveyAnswers[qid] += "," + value;
            }
        };

        vm.saveAnswers = function (answers){
            if(Object.keys(answers).length && Object.keys(answers).length === vm.survey.questions.length) {
                var answerVals = Object.values(answers);
                for(var i = 0; i < answerVals.length; i++) {
                    if(answerVals[i] === undefined) {
                        vm.saveOk = false;
                        return;
                    }
                }
                var data = {
                    auth: $rootScope.auth,
                    answers: answers,
                    survey_private: vm.survey.survey_private
                };
                $http.post('/answer/' + vm.surveyID,data)
                    .success(function(data) {
                        console.log(data);
                        vm.saveOk = true;
                    })
                    .error(function(data) {
                        vm.saveOk = false;
                        console.log('Error: ' + data);
                    });
            }
            else {
                vm.saveOk = false;
            }

        }
    }

})();
