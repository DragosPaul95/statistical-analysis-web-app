// app.js
var app = angular.module('app', ['ui.router']);

app.config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('newSurvey', {
            url: '/addquest',
            templateUrl: 'js/ng-templates/addquest.view.html',
            controller: 'addQuestController',
            controllerAs: 'vm'
        })
        .state('surveyResults', {
            url: '/results',
            templateUrl: 'js/ng-templates/questresults.view.html',
            controller: 'resultsController',
            controllerAs: 'vm'
        })
});