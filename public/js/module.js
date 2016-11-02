// app.js
var app = angular.module('app', ['ui.router', 'ngCookies', 'ngFlash'])
    .config(config)
    .run(run);

config.$inject = ['$locationProvider', '$stateProvider', '$urlRouterProvider'];
function config($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('newSurvey', {
            url: '/addquest',
            views:{
                'content':{
                    templateUrl:'js/ng-templates/addquest.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('login', {
            url: '/login',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/login.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html',
                }
            }
        })
        .state('surveyResults', {
            url: '/results',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/questresults.view.html',
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html',
                }
            }
        })
}

run.$inject = ['$rootScope', '$state', '$location', '$cookies'];
function run($rootScope, $state, $location, $cookies) {
    $rootScope.isLoggedIn = $cookies.getObject('loggedIn') || false;
    if (!$rootScope.isLoggedIn) {
        $location.path('/login');
    }

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // keep user logged in after page refresh
        $rootScope.isLoggedIn = $cookies.getObject('loggedIn') || false;
        if (!$rootScope.isLoggedIn) {
            $state.go('login');
        }
    });
}
