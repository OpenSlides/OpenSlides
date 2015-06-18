angular.module('OpenSlidesApp', [
    'angular-loading-bar',
    'js-data',
    'gettext',
    'ngAnimate',
    'ui.bootstrap',
    'ui.tree',
]);

angular.module('OpenSlidesApp.projector', [
    'OpenSlidesApp',
    'OpenSlidesApp.core.projector',
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.motions',
    'OpenSlidesApp.assignments',
    'OpenSlidesApp.users.projector',
    'OpenSlidesApp.mediafiles',
]);

angular.module('OpenSlidesApp.site', [
    'OpenSlidesApp',
    'ui.router',
    'ngBootbox',
    'ngFabForm',
    'ngMessages',
    'ngCsvImport',
    'ngSanitize',  // TODO: remove this as global dependency
    'ui.select',
    'xeditable',
    'OpenSlidesApp.core.site',
    'OpenSlidesApp.agenda.site',
    'OpenSlidesApp.motions.site',
    'OpenSlidesApp.assignments.site',
    'OpenSlidesApp.users.site',
    'OpenSlidesApp.mediafiles.site',
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
