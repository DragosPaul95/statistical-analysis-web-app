angular.module('app').directive('qcard', function(){
    return {
        restrict: 'A',
        template: '<div>{{aCard.name}} {{aCard.phone}}</div>',
        replace: true,
        transclude: false,
        scope: {
            qcard: '=vm.'
        }
    };
});