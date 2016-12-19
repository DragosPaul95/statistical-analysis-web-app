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
            var valueField;
            var valueText = "";
            if(response.data.showPercentages) {
                valueField = "valuePercentage";
                valueText = "%";
            }
            else valueField = "valueRaw";
            vm.amChartOptions[response.data.question_id] = {
                "type": "pie",
                "startDuration": 0,
                "theme": "light",
                "addClassNames": true,
                "legend":{
                    "position":"right",
                    "marginRight":100,
                    "autoMargins":false,
                    "valueText": "[[value]]" + valueText
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
                "valueField": valueField,
                "titleField": "option",
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
                        url: '/getstdev/' + response.data.question_id
                    }).then(function successCallback(response) {
                        vm.surveyStats[response.data.questionId] = {};
                        vm.surveyStats[response.data.questionId].stdev = response.data.stdev;
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


        vm.calculateNpCorrelation = function (questionId1, questionId2) {
            $http({
                method: 'GET',
                url: '/npcorrelation/' + questionId1 + "/" + questionId2
            }).then(function successCallback(response) {
                vm.surveyStats[questionId1].npdata = response.data;
                if(vm.surveyStats[questionId1].npdata.choices2.length >
                    vm.surveyStats[questionId1].npdata.choices1.length) vm.surveyStats[questionId1].npdata.order = 1;
                else vm.surveyStats[questionId1].npdata.order = 2;
            }, function errorCallback(response) {
                console.log('Error: ' + response);
            });
        };

        vm.calculateCorrelation = function (questionId1, questionId2) {
            if(questionId1 == 999 || questionId2 == 999) return;
            var q1 = vm.survey.questions.filter(function(el){
                return el.question_id === questionId1;
            });
            var q2 = vm.survey.questions.filter(function(el){
                return el.question_id === questionId2;
            });
            $http({
                method: 'GET',
                url: '/pcorrelation/' + questionId1 + "/" + questionId2
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
                        "title": q2[0].question_text + " (x axis)"
                    }, {
                        "axisAlpha": 0,
                        "dashLength": 1,
                        "position": "left",
                        "title": q1[0].question_text + " (y axis)"
                    }],
                    "startDuration": 1,
                    "graphs": [{
                        "balloonText": "y:[[y]] x:[[x]]",
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
            }, function errorCallback(response) {
                console.log('Error: ' + response);
            });
        };

        vm.calculateRegression = function (questionId1, questionId2) {
            if(questionId1 == 999 || questionId2 == 999) return;
            $http({
                method: 'GET',
                url: '/regression/' + questionId1 + "/" + questionId2
            }).then(function successCallback(response) {
                vm.surveyStats[response.data.questionId].regression = {};
                vm.regressionEqString = "Y = " + response.data.a.toFixed(4);
                if(response.data.b.toFixed(4) > 0) {
                    vm.regressionEqString += " + " + response.data.b.toFixed(4);
                }
                else {
                    vm.regressionEqString += " - " + Math.abs(response.data.b.toFixed(4));

                }
                vm.regressionEqString += " * X";
                vm.surveyStats[response.data.questionId].regression.a = response.data.a.toFixed(4);
                vm.surveyStats[response.data.questionId].regression.b = response.data.b.toFixed(4);

                var regressionWithQ = vm.survey.questions.filter(function(el){
                    return el.question_id === questionId2;
                });
                vm.surveyStats[response.data.questionId].regression.regressionWithText = regressionWithQ[0].question_text;
                console.log(vm.test);
            }, function errorCallback(response) {
                console.log('Error: ' + response);
            });
        };

        vm.calculateRegressionPrediction = function (questionId, x) {
            vm.surveyStats[questionId].regression.predictedY = (parseInt(vm.surveyStats[questionId].regression.a)
                                                                    + vm.surveyStats[questionId].regression.b * x).toFixed(4);
        }
    }

})();
