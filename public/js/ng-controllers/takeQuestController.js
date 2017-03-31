(function () {
    'use strict';

    angular
        .module('app')
        .controller('takeQuestController', takeQuestController);

    takeQuestController.$inject = ['$rootScope', '$scope', '$http', '$stateParams'];
    function takeQuestController($rootScope, $scope, $http, $stateParams) {
        var vm = this;
        vm.surveyID = $stateParams.surveyID;
        $http({
            method: 'GET',
            url: '/getSurvey/'+vm.surveyID
        }).then(function successCallback(response) {
            vm.survey = response.data;
            vm.surveyAnswers = {};
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
                    answers: answers
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
