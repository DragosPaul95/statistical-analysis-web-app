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


        vm.calculateCorrelation = function (questionId1, questionId2) {
            $http({
                method: 'GET',
                url: '/correlation/' + questionId1 + "/" + questionId2
            }).then(function successCallback(response) {
                vm.surveyStats[response.data.questionId].pearsonCoefficient = response.data.pearsonCoefficient;
                var chart = AmCharts.makeChart("chartdiv" + questionId1, {
                    "type": "xy",
                    "theme": "light",
                    "autoMarginOffset": 20,
                    "dataProvider": response.data.scatterPlotValues,
                    "valueAxes": [{
                        "position": "bottom",
                        "axisAlpha": 0,
                        "dashLength": 1,
                        "title": "X Axis"
                    }, {
                        "axisAlpha": 0,
                        "dashLength": 1,
                        "position": "left",
                        "title": "Y Axis"
                    }],
                    "startDuration": 1,
                    "graphs": [{
                        "balloonText": "x:[[x]] y:[[y]]",
                        "bullet": "round",
                        "minBulletSize": 10,
                        "lineAlpha": 0,
                        "xField": "ax",
                        "yField": "ay",
                        "lineColor": "#FF6600",
                        "fillAlphas": 0
                    }],
                    "marginLeft": 64,
                    "marginBottom": 60,
                    "export": {
                        "enabled": true,
                        "position": "bottom-right"
                    }
                });
                console.log("test");
            }, function errorCallback(response) {
                console.log('Error: ' + response);
            });
        }
    }

})();
