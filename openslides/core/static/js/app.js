angular.module('OpenSlidesApp', [
    'ui.router',
    'angular-loading-bar',
    'js-data',
    'gettext',
    'ngBootbox',
    'ngFabForm',
    'ngMessages',
    'ngAnimate',
    'ngCsvImport',
    'ngSanitize',
    'ui.bootstrap',
    'ui.select',
    'ui.tree',
    'xeditable',
    'OpenSlidesApp.core',
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.motions',
    'OpenSlidesApp.assignments',
    'OpenSlidesApp.users',
    'OpenSlidesApp.mediafiles',
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
