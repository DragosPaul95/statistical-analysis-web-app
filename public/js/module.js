// app.js
var app = angular.module('app', ['ui.router', 'ngCookies', 'ngFlash', 'ngMaterial', 'amChartsDirective', 'ngMessages'])
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
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('register', {
            url: '/register',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/register.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('surveyResults', {
            url: '/results',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/questresults.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('surveyStats', {
            url: '/stats/:surveyID',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/surveystats.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('mcanalysis', {
            url: '/multicriterial/:surveyID',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/multicriterialanalysis.view.html'
                },
                'header':{
                    templateUrl:'js/ng-templates/navbar.view.html'
                }
            }
        })
        .state('takeQuest', {
            url: '/survey/:surveyID',
            views:{
                'content':{
                    templateUrl: 'js/ng-templates/takequest.view.html'
                }
            }
        })
}

run.$inject = ['$rootScope', '$state', '$location', '$cookies'];
function run($rootScope, $state, $location, $cookies) {
    $rootScope.auth = $cookies.getObject('auth') || false;
    if (!$rootScope.auth) {
        $location.path('/register');
    }
    $rootScope.currentPage = $location.path().substring(1);

    $rootScope.$on('$locationChangeStart', function (event, next, current) {
        // keep user logged in after page refresh
        $rootScope.auth = $cookies.getObject('auth') || false;
        if (!$rootScope.auth) {
            $state.go('login');
        }
        $rootScope.currentPage = $location.path().substring(1);
    });
}
