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
            $http.post('/answer/' + vm.surveyID,answers)
                .success(function(data) {
                    console.log(data);
                })
                .error(function(data) {
                    console.log('Error: ' + data);
                });
        }
    }

})();
