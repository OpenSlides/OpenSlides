(function () {

'use strict';

// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'ui.router',
    'angular-loading-bar',
    'colorpicker.module',
    'formly',
    'formlyBootstrap',
    'localytics.directives',
    'ngBootbox',
    'ngDialog',
    'ngMessages',
    'ngCsvImport',
    'ui.tinymce',
    'luegg.directives',
])

// Provider to register entries for the main menu.
.provider('mainMenu', [
    function() {
        var mainMenuList = [];
        var scope;

        this.register = function(config) {
            mainMenuList.push(config);
        };

        this.$get = ['operator', function(operator) {
            return {
                registerScope: function (scope) {
                    var that = this;
                    this.scope = scope;
                    this.updateMainMenu();
                    operator.onOperatorChange(function () {that.updateMainMenu();});
                },
                updateMainMenu: function () {
                    this.scope.elements = this.getElements();
                },
                getElements: function() {
                    var elements = mainMenuList.filter(function (element) {
                        return typeof element.perm === "undefined" || operator.hasPerms(element.perm);
                    });

                    elements.sort(function (a, b) {
                        return a.weight - b.weight;
                    });
                    return elements;
                }
            };
        }];
    }
])

// Load the global data when the operator changes
.run([
    'loadGlobalData',
    'operator',
    function(loadGlobalData, operator) {
        operator.onOperatorChange(loadGlobalData);
    }
])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'home',
            'img_class': 'home',
            'title': gettext('Home'),
            'weight': 100,
            'perm': 'core.can_see_frontpage',
        });

        mainMenuProvider.register({
            'ui_sref': 'config',
            'img_class': 'cog',
            'title': gettext('Settings'),
            'weight': 1000,
            'perm': 'core.can_manage_config',
        });
    }
])

.config([
    '$urlRouterProvider',
    '$locationProvider',
    function($urlRouterProvider, $locationProvider) {
        // define fallback url and html5Mode
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);
    }
])

.config([
    '$httpProvider',
    function($httpProvider) {
        // Combine the django csrf system with the angular csrf system
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }
])

.config([
    '$stateProvider',
    '$urlMatcherFactoryProvider',
    function($stateProvider, $urlMatcherFactoryProvider) {
        // Make the trailing slash optional
        $urlMatcherFactoryProvider.strictMode(false);

        // Use stateProvider.decorator to give default values to our states
        $stateProvider.decorator('views', function(state, parent) {
            var result = {},
                views = parent(state);

            if (state.abstract || state.data && state.data.extern) {
                return views;
            }

            angular.forEach(views, function(config, name) {

                // Sets default values for templateUrl
                var patterns = state.name.split('.'),
                    templateUrl,
                    controller,
                    defaultControllers = {
                        create: 'CreateCtrl',
                        update: 'UpdateCtrl',
                        list: 'ListCtrl',
                        detail: 'DetailCtrl',
                    };

                // templateUrl
                if (_.last(patterns).match(/(create|update)/)) {
                    // When state_patterns is in the form "app.module.create" or
                    // "app.module.update", use the form template.
                    templateUrl = 'static/templates/' + patterns[0] + '/' + patterns[1] + '-form.html';
                } else {
                    // Replaces the first point through a slash (the app name)
                    var appName = state.name.replace('.', '/');
                    // Replaces any folowing points though a -
                    templateUrl = 'static/templates/' + appName.replace(/\./g, '-') + '.html';
                }
                config.templateUrl = state.templateUrl || templateUrl;

                // controller
                if (patterns.length >= 3) {
                    controller = _.capitalize(patterns[1]) + defaultControllers[_.last(patterns)];
                    config.controller = state.controller || controller;
                }
                result[name] = config;
            });
            return result;
        })

        .decorator('url', function(state, parent) {
            var defaultUrl;

            if (state.abstract) {
                defaultUrl = '';
            } else {
                var patterns = state.name.split('.'),
                    defaultUrls = {
                        create: '/new',
                        update: '/edit',
                        list: '',
                        // The id is expected to be an integer, if not, the url has to
                        // be defined manually
                        detail: '/{id:int}',
                    };

                defaultUrl = defaultUrls[_.last(patterns)];
            }

            state.url = state.url || defaultUrl;
            return parent(state);
        });
    }
])

.config([
    '$stateProvider',
    '$locationProvider',
    function($stateProvider, $locationProvider) {
        // Core urls
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'static/templates/home.html'
            })
            .state('projector', {
                url: '/projector',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('core', {
                url: '/core',
                abstract: true,
                template: "<ui-view/>",
            })

            // legal notice and version
            .state('legalnotice', {
                url: '/legalnotice',
                controller: 'LegalNoticeCtrl',
            })

            //config
            .state('config', {
                url: '/config',
                controller: 'ConfigCtrl',
                resolve: {
                    configOptions: function(Config) {
                        return Config.getConfigOptions();
                    }
                }
            })

            // search
            .state('search', {
                url: '/search?q',
                controller: 'SearchCtrl',
                templateUrl: 'static/templates/search.html',
            })

            // customslide
            .state('core.customslide', {
                url: '/customslide',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('core.customslide.detail', {
                resolve: {
                    customslide: function(Customslide, $stateParams) {
                        return Customslide.find($stateParams.id);
                    }
                }
            })
            // redirects to customslide detail and opens customslide edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from customslide controller use CustomSlideForm factory instead to open dialog in front
            // of current view without redirect)
            .state('core.customslide.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog', 'Customslide',
                    function($stateParams, $state, ngDialog, Customslide) {
                        ngDialog.open({
                            template: 'static/templates/core/customslide-form.html',
                            controller: 'CustomslideUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            resolve: {
                                customslide: function() {return Customslide.find($stateParams.id);}
                            },
                            preCloseCallback: function() {
                                $state.go('core.customslide.detail', {customslide: $stateParams.id});
                                return true;
                            }
                        });
                }]
            })
            // tag
            .state('core.tag', {
                url: '/tag',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('core.tag.list', {
                resolve: {
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
                }
            })
            .state('core.tag.create', {})
            .state('core.tag.detail', {
                resolve: {
                    tag: function(Tag, $stateParams) {
                        return Tag.find($stateParams.id);
                    }
                }
            })
            .state('core.tag.detail.update', {
                views: {
                    '@core.tag': {}
                }
            });

        $locationProvider.html5Mode(true);
    }
])

// Helper to add ui.router states at runtime.
// Needed for the django url_patterns.
.provider('runtimeStates', [
    '$stateProvider',
    function($stateProvider) {
        this.$get = function($q, $timeout, $state) {
            return {
                addState: function(name, state) {
                    $stateProvider.state(name, state);
                }
            };
        };
    }
])

// Load the django url patterns
.run([
    'runtimeStates',
    '$http',
    function(runtimeStates, $http) {
        $http.get('/core/url_patterns/').then(function(data) {
            for (var pattern in data.data) {
                runtimeStates.addState(pattern, {
                    'url': data.data[pattern],
                    data: {extern: true},
                    onEnter: function($window) {
                        $window.location.href = this.url;
                    }
                });
            }
        });
    }
])

// angular formly config options
.run([
    'formlyConfig',
    function (formlyConfig) {
        // NOTE: This next line is highly recommended. Otherwise Chrome's autocomplete
        // will appear over your options!
        formlyConfig.extras.removeChromeAutoComplete = true;

        // Configure custom types
        formlyConfig.setType({
          name: 'editor',
          extends: 'textarea',
          templateUrl: 'static/templates/core/editor.html',
        });
        formlyConfig.setType({
          name: 'select-single',
          extends: 'select',
          templateUrl: 'static/templates/core/select-single.html'
        });
        formlyConfig.setType({
          name: 'select-multiple',
          extends: 'select',
          templateUrl: 'static/templates/core/select-multiple.html'
        });
    }
])

// Options for TinyMCE editor used in various create and edit views.
.factory('Editor', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getOptions: function (images) {
                return {
                    language_url: '/static/tinymce/i18n/' + gettextCatalog.getCurrentLanguage() + '.js',
                    theme_url: '/static/js/openslides-libs.js',
                    skin_url: '/static/tinymce/skins/lightgray/',
                    inline: false,
                    statusbar: false,
                    browser_spellcheck: true,
                    image_advtab: true,
                    image_list: images,
                    plugins: [
                      'lists link autolink charmap preview searchreplace code fullscreen',
                      'paste textcolor colorpicker image imagetools'
                    ],
                    menubar: '',
                    toolbar: 'undo redo searchreplace | styleselect | bold italic underline strikethrough ' +
                        'forecolor backcolor removeformat | bullist numlist | outdent indent | ' +
                        'link image charmap table | code preview fullscreen'
                };
            }
        };
    }
])

// html-tag os-form-field to generate generic from fields
// TODO: make it possible to use other fields then config fields
.directive('osFormField', [
    '$parse',
    'Config',
    'gettextCatalog',
    function($parse, Config, gettextCatalog) {
        function getHtmlType(type) {
            return {
                string: 'text',
                text: 'textarea',
                integer: 'number',
                boolean: 'checkbox',
                choice: 'choice',
                colorpicker: 'colorpicker',
            }[type];
        }

        return {
            restrict: 'E',
            scope: true,
            templateUrl: '/static/templates/config-form-field.html',
            link: function ($scope, iElement, iAttrs, controller, transcludeFn) {
                var field = $parse(iAttrs.field)($scope);
                var config = Config.get(field.key);
                $scope.type = getHtmlType(field.input_type);
                if ($scope.type == 'choice') {
                    $scope.choices = [];
                    angular.forEach(field.choices, function(choice) {
                        choice.display_name = gettextCatalog.getString(choice.display_name);
                        $scope.choices.push(choice);
                    });
                }
                $scope.label = field.label;
                $scope.key = 'field-' + field.key;
                $scope.value = gettextCatalog.getString(config.value);
                $scope.help_text = field.help_text;
                $scope.default_value = field.default_value;
                $scope.reset = function () {
                    $scope.value = gettextCatalog.getString($scope.default_value);
                    $scope.save(field.key, $scope.value);
                };
            }
        };
    }
])

.directive('routeLoadingIndicator', [
    '$rootScope',
    '$state',
    'gettext',
    function($rootScope, $state, gettext) {
        gettext('Loading ...');
        return {
            restrict: 'E',
            template: "<div class='header spacer-bottom' ng-if='isRouteLoading'><div class='title'><h1><translate>Loading ...</translate> <i class='fa fa-spinner fa-pulse'></i></h1></div></div>",
            link: function(scope, elem, attrs) {
                scope.isRouteLoading = false;
                $rootScope.$on('$stateChangeStart', function() {
                    scope.isRouteLoading = true;
                });
                $rootScope.$on('$stateChangeSuccess', function() {
                    scope.isRouteLoading = false;
                });
            }
        };
    }
])

.controller('MainMenuCtrl', [
    '$scope',
    'mainMenu',
    function ($scope, mainMenu) {
        mainMenu.registerScope($scope);
        $scope.isMenuOpen = false;
        $scope.closeMenu = function () {
            $scope.isMenuOpen = false;
        };
    }
])

.controller('LanguageCtrl', [
    '$scope',
    'gettextCatalog',
    'Languages',
    'filterFilter',
    function ($scope, gettextCatalog, Languages, filterFilter) {
        $scope.languages = Languages.getLanguages();
        $scope.selectedLanguage = filterFilter($scope.languages, {selected: true});
        // controller to switch app language
        $scope.switchLanguage = function (lang) {
            $scope.languages = Languages.setCurrentLanguage(lang);
            $scope.selectedLanguage = filterFilter($scope.languages, {selected: true});
        };
    }
])

// Projector Sidebar Controller
.controller('ProjectorSidebarCtrl', [
    '$scope',
    function ($scope) {
        $scope.isProjectorSidebar = false;
        $scope.showProjectorSidebar = function (show) {
            $scope.isProjectorSidebar = show;
        };
    }
])

// Legal Notice Controller
.controller('LegalNoticeCtrl', [
    '$scope',
    '$http',
    function ($scope, $http) {
        $http.get('/core/version/').success(function(data) {
            $scope.core_version = data.openslides_version;
            $scope.plugins = data.plugins;
        });
    }
])

// Config Controller
.controller('ConfigCtrl', [
    '$scope',
    'Config',
    'configOptions',
    function($scope, Config, configOptions) {
        Config.bindAll({}, $scope, 'configs');
        $scope.configGroups = configOptions.data.config_groups;

        // save changed config value
        $scope.save = function(key, value) {
            Config.get(key).value = value;
            Config.save(key);
        };
    }
])

// Search Bar Controller
.controller('SearchBarCtrl', [
    '$scope',
    '$state',
    function ($scope, $state) {
        $scope.search = function(query) {
            $scope.query = '';
            $state.go('search', {q: query});
        };
    }
])
// Search Controller
.controller('SearchCtrl', [
    '$scope',
    '$http',
    '$stateParams',
    'DS',
    function ($scope, $http, $stateParams, DS) {
        // search function
        $scope.search = function(query) {
            $http.get('/core/search_api/?q=' + query).then(function(success) {
                var elements = success.data.elements;
                $scope.results = [];
                angular.forEach(elements, function(element) {
                    DS.find(element.collection, element.id).then(function(data) {
                        data.urlState = element.collection.replace('/','.')+'.detail';
                        data.urlParam = {id: element.id};
                        $scope.results.push(data);
                    });
                });
            });
        };

        // run search with get parameter from url
        if ($stateParams.q) {
            $scope.search($stateParams.q);
            $scope.query = $stateParams.q;
        }
    }
])


// Provide generic customslide form fields for create and update view
.factory('CustomslideForm', [
    'gettextCatalog',
    'Editor',
    'Mediafile',
    function (gettextCatalog, Editor, Mediafile) {
        return {
            // ngDialog for customslide form
            getDialog: function (customslide) {
                var resolve = {};
                if (customslide) {
                    resolve = {
                        customslide: function(Customslide) {return Customslide.find(customslide.id);}
                    };
                }
                resolve.mediafiles = function(Mediafile) {return Mediafile.findAll();};
                return {
                    template: 'static/templates/core/customslide-form.html',
                    controller: (customslide) ? 'CustomslideUpdateCtrl' : 'CustomslideCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            getFormFields: function () {
                var images = Mediafile.getAllImages();
                return [
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
                        required: true
                    }
                },
                {
                    key: 'text',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Text')
                    },
                    data: {
                        tinymceOption: Editor.getOptions(images)
                    }
                },
                {
                    key: 'attachments_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Attachment'),
                        options: Mediafile.getAll(),
                        ngOptions: 'option.id as option.title_or_filename for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search an attachment ...')
                    }
                },
                {
                    key: 'showAsAgendaItem',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show as agenda item'),
                        description: gettextCatalog.getString('If deactivated it appears as internal item on agenda.')
                    }
                },
                ];
            }
        };
    }
])

// Projector Control Controller
.controller('ProjectorControlCtrl', [
    '$scope',
    '$http',
    '$interval',
    '$state',
    'Config',
    'Projector',
    function($scope, $http, $interval, $state, Config, Projector) {
         // bind projector elements to the scope, update after projector changed
        $scope.$watch(function () {
            return Projector.lastModified(1);
        }, function () {
            // stop ALL interval timer
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].interval ) {
                    $interval.cancel($scope.countdowns[i].interval);
                }
            }
            // rebuild all variables after projector update
            $scope.rebuildAllElements();
        });
        $scope.$on('$destroy', function() {
            // Cancel all intervals if the controller is destroyed
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].interval ) {
                    $interval.cancel($scope.countdowns[i].interval);
                }
            }

        });

        // *** countdown functions ***
        $scope.calculateCountdownTime = function (countdown) {
            countdown.seconds = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        };
        $scope.rebuildAllElements = function () {
            $scope.countdowns = [];
            $scope.messages = [];
            // iterate via all projector elements and catch all countdowns and messages
            $.each(Projector.get(1).elements, function(key, value) {
                if (value.name == 'core/countdown') {
                    $scope.countdowns.push(value);
                    if (value.status == "running") {
                        // calculate remaining seconds directly because interval starts with 1 second delay
                        $scope.calculateCountdownTime(value);
                        // start interval timer (every second)
                        value.interval = $interval( function() { $scope.calculateCountdownTime(value); }, 1000);
                    } else {
                        value.seconds = value.countdown_time;
                    }
                }
                if (value.name == 'core/message') {
                    $scope.messages.push(value);
                }
            });
            $scope.scrollLevel = Projector.get(1).scroll;
            $scope.scaleLevel = Projector.get(1).scale;
        };

        // get initial values for $scope.countdowns, $scope.messages, $scope.scrollLevel
        // and $scope.scaleLevel (after page reload)
        $scope.rebuildAllElements();

        $scope.addCountdown = function () {
            var defaultvalue = parseInt(Config.get('projector_default_countdown').value);
            $http.post('/rest/core/projector/1/activate_elements/', [{
                    name: 'core/countdown',
                    status: 'stop',
                    visible: false,
                    index: $scope.countdowns.length,
                    countdown_time: defaultvalue,
                    default: defaultvalue,
                    stable: true
            }]);
        };
        $scope.removeCountdown = function (countdown) {
            var data = {};
            var delta = 0;
            // rebuild index for all countdowns after the selected (deleted) countdown
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].uuid == countdown.uuid ) {
                    delta = 1;
                } else if (delta > 0) {
                        data[$scope.countdowns[i].uuid] = { "index": i - delta };
                }
            }
            $http.post('/rest/core/projector/1/deactivate_elements/', [countdown.uuid]);
            if (Object.keys(data).length > 0) {
                $http.post('/rest/core/projector/1/update_elements/', data);
            }
        };
        $scope.showCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = { "visible": !countdown.visible };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.editCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = {
                "description": countdown.description,
                "default": parseInt(countdown.default)
            };
            if (countdown.status == "stop") {
                data[countdown.uuid].countdown_time = parseInt(countdown.default);
            }
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.startCountdown = function (countdown) {
            var data = {};
            // calculate end point of countdown (in seconds!)
            var endTimestamp = Date.now() / 1000 - $scope.serverOffset + countdown.countdown_time;
            data[countdown.uuid] = {
                "status": "running",
                "countdown_time": endTimestamp
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.stopCountdown = function (countdown) {
            var data = {};
            // calculate rest duration of countdown (in seconds!)
            var newDuration = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
            data[countdown.uuid] = {
                "status": "stop",
                "countdown_time": newDuration
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.resetCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = {
                "status": "stop",
                "countdown_time": countdown.default,
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };

        // *** message functions ***
        $scope.addMessage = function () {
            $http.post('/rest/core/projector/1/activate_elements/', [{
                    name: 'core/message',
                    visible: false,
                    index: $scope.messages.length,
                    message: '',
                    stable: true
            }]);
        };
        $scope.removeMessage = function (message) {
            $http.post('/rest/core/projector/1/deactivate_elements/', [message.uuid]);
        };
        $scope.showMessage = function (message) {
            var data = {};
            // if current message is activated, deactivate all other messages
            if ( !message.visible ) {
                for (var i=0; i<$scope.messages.length; i++) {
                    if ( $scope.messages[i].uuid == message.uuid ) {
                        data[$scope.messages[i].uuid] = { "visible": true };
                    } else {
                        data[$scope.messages[i].uuid] = { "visible": false };
                    }
                }
            } else {
                data[message.uuid] = { "visible": false };
            }
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.editMessage = function (message) {
            var data = {};
            data[message.uuid] = {
                "message": message.message,
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
            message.editMessageFlag = false;
        };

        // *** projector controls ***
        $scope.scrollLevel = Projector.get(1).scroll;
        $scope.scaleLevel = Projector.get(1).scale;
        $scope.controlProjector = function (action, direction) {
            $http.post('/rest/core/projector/1/control_view/', {"action": action, "direction": direction});
        };
        $scope.editCurrentSlide = function () {
            $.each(Projector.get(1).elements, function(key, value) {
                if (value.name == 'agenda/list-of-speakers') {
                    $state.go('agenda.item.detail', {id: value.id});
                } else if (
                    value.name != 'agenda/item-list' &&
                    value.name != 'core/clock' &&
                    value.name != 'core/countdown' &&
                    value.name != 'core/message' ) {
                    $state.go(value.name.replace('/', '.')+'.detail.update', {id: value.id});
                }
            });
        };
    }
])

// Customslide Controllers
.controller('CustomslideDetailCtrl', [
    '$scope',
    'ngDialog',
    'CustomslideForm',
    'Customslide',
    'customslide',
    function($scope, ngDialog, CustomslideForm, Customslide, customslide) {
        Customslide.bindOne(customslide.id, $scope, 'customslide');
        Customslide.loadRelations(customslide, 'agenda_item');

        // open edit dialog
        $scope.openDialog = function (customslide) {
            ngDialog.open(CustomslideForm.getDialog(customslide));
        };
    }
])

.controller('CustomslideCreateCtrl', [
    '$scope',
    '$state',
    'Customslide',
    'CustomslideForm',
    'Agenda',
    function($scope, $state, Customslide, CustomslideForm, Agenda) {
        $scope.customslide = {};
        $scope.model = {};
        $scope.model.showAsAgendaItem = true;
        // get all form fields
        $scope.formFields = CustomslideForm.getFormFields();

        // save form
        $scope.save = function (customslide) {
            Customslide.create(customslide).then(
                function(success) {
                    // find related agenda item
                    Agenda.find(success.agenda_item_id).then(function(item) {
                        // check form element and set item type (AGENDA_ITEM = 1, HIDDEN_ITEM = 2)
                        var type = customslide.showAsAgendaItem ? 1 : 2;
                        // save only if agenda item type is modified
                        if (item.type != type) {
                            item.type = type;
                            Agenda.save(item);
                        }
                    });
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('CustomslideUpdateCtrl', [
    '$scope',
    '$state',
    'Customslide',
    'CustomslideForm',
    'Agenda',
    'customslide',
    function($scope, $state, Customslide, CustomslideForm, Agenda, customslide) {
        $scope.alert = {};
        // set initial values for form model by create deep copy of customslide object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(customslide);
        // get all form fields
        $scope.formFields = CustomslideForm.getFormFields();
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "showAsAgendaItem") {
                // get state from agenda item (hidden/internal or agenda item)
                $scope.formFields[i].defaultValue = !customslide.agenda_item.is_hidden;
            }
        }

        // save form
        $scope.save = function (customslide) {
            // inject the changed customslide (copy) object back into DS store
            Customslide.inject(customslide);
            // save change customslide object on server
            Customslide.save(customslide).then(
                function(success) {
                    // save agenda specific stuff
                    var type = customslide.showAsAgendaItem ? 1 : 2;
                    if (customslide.agenda_item.type != type) {
                        customslide.agenda_item.type = type;
                        Agenda.save(customslide.agenda_item);
                    }
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original customslide object from server
                    Customslide.refresh(customslide);
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };
    }
])

// Tag Controller
.controller('TagListCtrl', [
    '$scope',
    'Tag',
    function($scope, Tag) {
        Tag.bindAll({}, $scope, 'tags');

        // setup table sorting
        $scope.sortColumn = 'name';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };

        // save changed tag
        $scope.save = function (tag) {
            Tag.save(tag);
        };
        $scope.delete = function (tag) {
            Tag.destroy(tag.id).then(
                function(success) {
                    //TODO: success message
                }
            );
        };
    }
])

.controller('TagDetailCtrl', [
    '$scope',
    'Tag',
    'tag',
    function($scope, Tag, tag) {
        Tag.bindOne(tag.id, $scope, 'tag');
    }
])

.controller('TagCreateCtrl', [
    '$scope',
    '$state',
    'Tag',
    function($scope, $state, Tag) {
        $scope.tag = {};
        $scope.save = function (tag) {
            Tag.create(tag).then(
                function(success) {
                    $state.go('core.tag.list');
                }
            );
        };
    }
])

.controller('TagUpdateCtrl', [
    '$scope',
    '$state',
    'Tag',
    'tag',
    function($scope, $state, Tag, tag) {
        $scope.tag = tag;
        $scope.save = function (tag) {
            Tag.save(tag).then(
                function(success) {
                    $state.go('core.tag.list');
                }
            );
        };
    }
])

// counter of new (unread) chat messages
.value('NewChatMessages', [])

// ChatMessage Controller
.controller('ChatMessageCtrl', [
    '$scope',
    '$http',
    '$timeout',
    'ChatMessage',
    'NewChatMessages',
    function ($scope, $http, $timeout, ChatMessage, NewChatMessages) {
        ChatMessage.bindAll({}, $scope, 'chatmessages');
        $scope.unreadMessages = NewChatMessages.length;
        $scope.chatboxIsCollapsed = true;
        $scope.openChatbox = function () {
            $scope.chatboxIsCollapsed = !$scope.chatboxIsCollapsed;
            NewChatMessages = [];
            $scope.unreadMessages = NewChatMessages.length;
            $timeout(function () {
                angular.element('#messageInput').focus();
            }, 0);
        };
        $scope.sendMessage = function () {
            angular.element('#messageSendButton').addClass('disabled');
            angular.element('#messageInput').attr('disabled', '');
            $http.post(
                '/rest/core/chatmessage/',
                {message: $scope.newMessage}
            )
            .success(function () {
                $scope.newMessage = '';
                angular.element('#messageSendButton').removeClass('disabled');
                angular.element('#messageInput').removeAttr('disabled');
                $timeout(function () {
                    angular.element('#messageInput').focus();
                }, 0);
            })
            .error(function () {
                angular.element('#messageSendButton').removeClass('disabled');
                angular.element('#messageInput').removeAttr('disabled');
            });
        };
        // increment unread messages counter for each new message
        $scope.$watch('chatmessages', function (newVal, oldVal) {
            // add new message id if there is really a new message which is not yet tracked
            if (oldVal.length > 0) {
                if ((oldVal[oldVal.length-1].id != newVal[newVal.length-1].id) &&
                    ($.inArray(newVal[newVal.length-1].id, NewChatMessages) == -1)) {
                    NewChatMessages.push(newVal[newVal.length-1].id);
                    $scope.unreadMessages = NewChatMessages.length;
                }
            }
        });
    }
])

// format time string for model ("s") and view format ("h:mm:ss" or "mm:ss")
.directive('minSecFormat', [
    function () {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (mm:ss) to model format (s)
                    var time = data.split(':');
                    if (time.length > 1) {
                        data = (+time[0]) * 60 + (+time[1]);
                        if (data < 0) {
                            data = "-"+data;
                        }
                    }
                    return data;
                });

                ngModelController.$formatters.push(function(data) {
                    //convert data from model format (s) to view format (mm:ss)
                    var time;
                    // floor returns the largest integer of the absolut value of totalseconds
                    var total = Math.floor(Math.abs(data));
                    var mm = Math.floor(total / 60);
                    var ss = Math.floor(total % 60);
                    var zero = "0";
                    // Add leading "0" for double digit values
                    if (mm.length < 2) {
                        mm = (zero+mm).slice(-2);
                    }
                    ss = (zero+ss).slice(-2);
                    time =  mm + ':' + ss;
                    if (data < 0) {
                        time = "-"+time;
                    }
                    return time;
                });
            }
        };
    }
])

.directive('osFocusMe', [
    '$timeout',
    function ($timeout) {
        return {
            link: function (scope, element, attrs, model) {
                $timeout(function () {
                    element[0].focus();
                });
            }
        };
    }
])

//Mark all core config strings for translation in Javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Presentation and assembly system');
        gettext('Event name');
        gettext('<a href="http://www.openslides.org">OpenSlides</a> is a free ' +
                'web based presentation and assembly system for visualizing ' +
                'and controlling agenda, motions and elections of an ' +
                'assembly.');
        gettext('General');
        gettext('Event');
        gettext('Short description of event');
        gettext('Event date');
        gettext('Event location');
        gettext('Event organizer');
        gettext('Legal notice');
        gettext('Front page title');
        gettext('Welcome to OpenSlides');
        gettext('Front page text');
        gettext('[Space for your welcome text.]');
        gettext('Allow access for anonymous guest users');
        gettext('Show this text on the login page.');
        gettext('Show logo on projector');
        gettext('You can replace the logo. Just copy a file to ' +
                '"static/img/logo-projector.png" in your OpenSlides data ' +
                'path.');
        gettext('Projector');
        gettext('Show title and description of event on projector');
        gettext('Background color of projector header and footer');
        gettext('Font color of projector header and footer');
        gettext('Font color of projector headline');
        gettext('Default countdown');
    }
]);

}());
