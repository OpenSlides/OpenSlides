angular.module('OpenSlidesApp', [
    'ui.router',
    'js-data',
    'OpenSlidesApp.core',
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.assignments',
    'OpenSlidesApp.users',
])

.config(function($urlRouterProvider, $locationProvider) {
    // define fallback url and html5Mode
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
})

.config(function($httpProvider) {
    // Combine the django csrf system with the angular csrf system
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});
