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
                vm.surveyStats[questionId1].npdata = 400;
            });
        };

        vm.calculateCorrelation = function (questionId1, questionId2) {
            if(questionId1 == 999 || questionId2 == 999) return;
            if(questionId1 === questionId2) {
                vm.surveyStats[questionId1].pearsonCoefficient = "same";
                return;
            }
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
                vm.surveyStats[questionId1].pearsonCoefficient = "cantAnalyse";
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
        };

        vm.makeBellCurveChart = function (questionId, verticals) {
            // Calculates a point Z(x), the Probability Density Function, on any normal curve.
// This is the height of the point ON the normal curve.
// For values on the Standard Normal Curve, call with Mean = 0, StdDev = 1.
            function NormalDensityZx( x, Mean, StdDev ) {
                var a = x - Mean;
                return Math.exp( -( a * a ) / ( 2 * StdDev * StdDev ) ) / ( Math.sqrt( 2 * Math.PI ) * StdDev );
            }
            //----------------------------------------------------------------------------------------------
            // Calculates Q(x), the right tail area under the Standard Normal Curve.
            function StandardNormalQx( x ) {
                if ( x === 0 ) // no approximation necessary for 0
                    return 0.50;

                var t1, t2, t3, t4, t5, qx;
                var negative = false;
                if ( x < 0 ) {
                    x = -x;
                    negative = true;
                }
                t1 = 1 / ( 1 + ( 0.2316419 * x ) );
                t2 = t1 * t1;
                t3 = t2 * t1;
                t4 = t3 * t1;
                t5 = t4 * t1;
                qx = NormalDensityZx( x, 0, 1 ) * ( ( 0.319381530 * t1 ) + ( -0.356563782 * t2 ) +
                    ( 1.781477937 * t3 ) + ( -1.821255978 * t4 ) + ( 1.330274429 * t5 ) );
                if ( negative == true )
                    qx = 1 - qx;
                return qx;
            }
            //----------------------------------------------------------------------------------------------
            // Calculates P(x), the left tail area under the Standard Normal Curve, which is 1 - Q(x).
            function StandardNormalPx( x ) {
                return 1 - StandardNormalQx( x );
            }
            //----------------------------------------------------------------------------------------------
            // Calculates A(x), the area under the Standard Normal Curve between +x and -x.
            function StandardNormalAx( x ) {
                return 1 - ( 2 * StandardNormalQx( Math.abs( x ) ) );
            }
            //----------------------------------------------------------------------------------------------


            /**
             * Calculate data
             */
            var chartData = [];
            var colorCount = 0;
            for ( var i = -5; i < 5.1; i += 0.1 ) {
                var dp = {
                    category: i,
                    value: NormalDensityZx( i, 0, 1 )
                };
                if ( verticals.indexOf( Math.round( i * 10 ) / 10 ) !== -1 ) {
                    if(colorCount == 0 || colorCount == 2) dp.color = "#000000";
                    else dp.color = "#e5f442";
                    colorCount++;
                    dp.vertical = dp.value;
                }
                chartData.push( dp );
            }

            /**
             * Create a chart
             */
            var chart = AmCharts.makeChart( "bellcurve" + questionId, {
                "type": "serial",
                "theme": "light",
                "dataProvider": chartData,
                "precision": 2,
                "valueAxes": [ {
                    "gridAlpha": 0.2,
                    "dashLength": 0
                } ],
                "startDuration": 1,
                "graphs": [ {
                    "balloonText": "[[category]]: <b>[[value]]</b>",
                    "lineThickness": 3,
                    "valueField": "value"
                }, {
                    "balloonText": "",
                    "fillAlphas": 1,
                    "type": "column",
                    "valueField": "vertical",
                    "colorField": "color",
                    "fixedColumnWidth": 4,
                    "labelText": "[[category]]",
                    "labelOffset": 20,
                    "labelFunction": function(label, item) {
                        return parseFloat(item).toFixed(3);
                    }
                } ],
                "chartCursor": {
                    "categoryBalloonEnabled": false,
                    "cursorAlpha": 0,
                    "zoomable": false
                },
                "categoryField": "category",
                "categoryAxis": {
                    "gridAlpha": 0.05,
                    "startOnAxis": true,
                    "tickLength": 5,
                    "labelFunction": function( label, item ) {
                        return '' + Math.round( item.dataContext.category * 10 ) / 10;
                    }
                }

            } );
        };

        vm.compute_ttest = function (questionId1, questionId2) {
            $http({
                method: 'GET',
                url: '/ttest/' + questionId1 + "/" + questionId2
            }).then(function successCallback(response) {
                vm.surveyStats[questionId1].ttestData = response.data;
                var linesArr = [
                    parseFloat(response.data.lowerTinterval).toFixed(1)/1, (parseFloat(response.data.t_val)).toFixed(1)/1, (parseFloat(response.data.upperTinterval)).toFixed(1)/1];
                vm.makeBellCurveChart(questionId1, linesArr);
            }, function errorCallback(response) {
                vm.surveyStats[questionId1].ttestData = 400;
            });
        }
    }

})();
