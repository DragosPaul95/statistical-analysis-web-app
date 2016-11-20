(function () {
    'use strict';

    angular
        .module('app')
        .controller('surveyStatsController', surveyStatsController);

    surveyStatsController.$inject = ['$rootScope', '$scope', '$http', '$stateParams'];
    function surveyStatsController($rootScope, $scope, $http, $stateParams) {
        var vm = this;
        vm.surveyID = $stateParams.surveyID;

        $http({
            method: 'GET',
            url: '/getSurvey/' + vm.surveyID
        }).then(function successCallback(response) {
            vm.survey = response.data;
            vm.amChartOptions = {};
            for(var i = 0 ; i < vm.survey.questions.length; i++) {
                $http({
                    method: 'GET',
                    url: '/questionstats/' + vm.survey.questions[i].question_id
                }).then(function successCallback(response) {
                    vm.questionsStats = response.data;
                    vm.amChartOptions[vm.questionsStats.question_id] = {
                        "type": "pie",
                        "startDuration": 0,
                        "theme": "light",
                        "addClassNames": true,
                        "legend":{
                            "position":"right",
                            "marginRight":100,
                            "autoMargins":false,
                            "valueText": "[[value]]%"
                        },
                        "innerRadius": "30%",
                        "defs": {
                            "filter": [{
                                "id": "shadow",
                                "width": "200%",
                                "height": "200%",
                                "feOffset": {
                                    "result": "offOut",
                                    "in": "SourceAlpha",
                                    "dx": 0,
                                    "dy": 0
                                },
                                "feGaussianBlur": {
                                    "result": "blurOut",
                                    "in": "offOut",
                                    "stdDeviation": 5
                                },
                                "feBlend": {
                                    "in": "SourceGraphic",
                                    "in2": "blurOut",
                                    "mode": "normal"
                                }
                            }]
                        },
                        "data": vm.questionsStats.answers,
                        "valueField": "value",
                        "titleField": "option",
                        "export": {
                            "enabled": true
                        }
                    };
                }, function errorCallback(response) {
                    console.log('Error: ' + response);
                });
            }

        }, function errorCallback(response) {
            console.log('Error: ' + response);
        });



    }

})();
