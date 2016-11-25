(function () {
    'use strict';

    angular
        .module('app')
        .controller('surveyStatsController', surveyStatsController);

    surveyStatsController.$inject = ['$rootScope', '$scope', '$http', '$stateParams'];
    function surveyStatsController($rootScope, $scope, $http, $stateParams) {
        var vm = this;
        vm.surveyID = $stateParams.surveyID;

        vm.makeChart = function (response) {
            vm.amChartOptions[response.data.question_id] = {
                "type": "pie",
                "startDuration": 0,
                "theme": "light",
                "addClassNames": true,
                "legend":{
                    "position":"right",
                    "marginRight":100,
                    "autoMargins":false,
                    "valueText": "[[value]][[test]]"
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
                "valueField": "valueRaw",
                "titleField": "option",
                "testField": "valuePercentage",
                "export": {
                    "enabled": true
                }
            };
        };
        $http({
            method: 'GET',
            url: '/getSurvey/' + vm.surveyID
        }).then(function successCallback(response) {
            vm.survey = response.data;
            vm.surveyStats = {};
            vm.amChartOptions = {};
            for(var i = 0 ; i < vm.survey.questions.length; i++) {
                $http({
                    method: 'GET',
                    url: '/questionstats/' + vm.survey.questions[i].question_id
                }).then(function successCallback(response) {
                    vm.questionsStats = response.data;
                    vm.makeChart(response);
                    $http({
                        method: 'GET',
                        url: '/getstats/' + response.data.question_id
                    }).then(function successCallback(response) {
                        vm.surveyStats[response.data.questionId] = response.data.stats;
                    }, function errorCallback(response) {
                        console.log('Error: ' + response);
                    });
                }, function errorCallback(response) {
                    console.log('Error: ' + response);
                });
            }

        }, function errorCallback(response) {
            console.log('Error: ' + response);
        });



    }

})();
