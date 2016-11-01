(function () {

'use strict';

// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'OpenSlidesApp.poll.majority',
    'ui.router',
    'angular-loading-bar',
    'colorpicker.module',
    'formly',
    'formlyBootstrap',
    'localytics.directives',
    'ngBootbox',
    'ngDialog',
    'ngFileSaver',
    'ngMessages',
    'ngCsvImport',
    'ui.tinymce',
    'luegg.directives',
])

// Can be used to find out if the projector or the side is used
.constant('REALM', 'site')

.factory('DateTimePickerTranslation', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getButtons: function () {
                return {
                    show: true,
                    now: {
                        show: true,
                        text: gettextCatalog.getString('now')
                    },
                    today: {
                        show: true,
                        text: gettextCatalog.getString('today')
                    },
                    clear: {
                        show: true,
                        text: gettextCatalog.getString('clear')
                    },
                    date: {
                        show: true,
                        text: gettextCatalog.getString('date')
                    },
                    time: {
                        show: true,
                        text: gettextCatalog.getString('time')
                    },
                    close: {
                        show: true,
                        text: gettextCatalog.getString('close')
                    }
                };
            }
        };
    }

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
                // Sets additional default values for templateUrl
                var templateUrl,
                    controller,
                    defaultControllers = {
                        create: 'CreateCtrl',
                        update: 'UpdateCtrl',
                        list: 'ListCtrl',
                        detail: 'DetailCtrl',
                    };

                // Split up state name
                // example: "motions.motion.detail.update" -> ['motions', 'motion', 'detail', 'update']
                var patterns = state.name.split('.');

                // set app and module name from state
                // - appName: patterns[0] (e.g. "motions")
                // - moduleNames: patterns without first element (e.g. ["motion", "detail", "update"])
                var appName = '';
                var moduleName = '';
                var moduleNames = [];
                if (patterns.length > 0) {
                    appName = patterns[0];
                    moduleNames = patterns.slice(1);
                }
                if (moduleNames.length > 0) {
                    // convert from camcelcase to dash notation
                    // example: ["motionBlock", "detail"] -> ["motion-block", "detail"]
                    for (var i = 0; i < moduleNames.length; i++) {
                        moduleNames[i] =  moduleNames[i].replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
                    }

                    // use special templateUrl for create and update view
                    // example: ["motion", "detail", "update"] -> "motion-form"
                    if (_.last(moduleNames).match(/(create|update)/)) {
                        moduleName = '/' + moduleNames[0] + '-form';
                    } else {
                        // convert modelNames array to url string
                        // example: ["motion-block", "detail"] -> "motion-block-detail"
                        moduleName = '/' + moduleNames.join('-');
                    }
                }
                templateUrl = 'static/templates/' + appName + moduleName + '.html';
                config.templateUrl = state.templateUrl || templateUrl;

                // controller
                if (patterns.length >= 3) {
                    controller = _.upperFirst(patterns[1]) + defaultControllers[_.last(patterns)];
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
                url: '/projector/{id:int}',
                templateUrl: 'static/templates/projector-container.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('real-projector', {
                url: '/real-projector/{id:int}',
                templateUrl: 'static/templates/projector.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('manage-projectors', {
                url: '/manage-projectors',
                templateUrl: 'static/templates/core/manage-projectors.html',
                controller: 'ManageProjectorsCtrl'
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

// Load the global data on startup
.run([
    'loadGlobalData',
    function(loadGlobalData) {
        loadGlobalData();
    }
])

// Options for TinyMCE editor used in various create and edit views.
.factory('Editor', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getOptions: function (images, inlineMode) {
                if (inlineMode === undefined) {
                    inlineMode = false;
                }
                return {
                    language_url: '/static/tinymce/i18n/' + gettextCatalog.getCurrentLanguage() + '.js',
                    theme_url: '/static/js/openslides-libs.js',
                    skin_url: '/static/tinymce/skins/lightgray/',
                    inline: inlineMode,
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
        var getHtmlType = function (type) {
            return {
                string: 'text',
                text: 'textarea',
                integer: 'number',
                boolean: 'checkbox',
                choice: 'choice',
                comments: 'comments',
                colorpicker: 'colorpicker',
                datetimepicker: 'datetimepicker',
                majorityMethod: 'choice',
            }[type];
        };

        return {
            restrict: 'E',
            scope: true,
            templateUrl: 'static/templates/config-form-field.html',
            link: function ($scope, iElement, iAttrs, controller, transcludeFn) {
                var field = $parse(iAttrs.field)($scope);
                var config = Config.get(field.key);
                $scope.type = getHtmlType(field.input_type);
                if ($scope.type == 'choice') {
                    $scope.choices = field.choices;
                    $scope.value = config.value;
                } else {
                    $scope.value = gettextCatalog.getString(config.value);
                }
                $scope.label = field.label;
                $scope.key = 'field-' + field.key;
                $scope.help_text = field.help_text;
                $scope.default_value = field.default_value;
                $scope.reset = function () {
                    if ($scope.type == 'choice') {
                        $scope.value = $scope.default_value;
                    } else {
                        $scope.value = gettextCatalog.getString($scope.default_value);
                    }
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
    '$document',
    '$window',
    function ($scope, $document, $window) {
        $scope.isProjectorSidebar = false;
        $scope.showProjectorSidebar = function (show) {
            $scope.isProjectorSidebar = show;
        };

        // Sidebar scroll
        var marginTop = 20, // margin-top from #content
            marginBottom = 30, // 30px + 20px sidebar margin-bottom = 50px from footer
            sidebar;

        var sidebarScroll = function () {
            var sidebarHeight = sidebar.height(),
                sidebarOffset = sidebar.offset().top,
                sidebarMinOffset = $('#header').height() + $('#nav').height() + marginTop,
                documentHeight = $document.height(),
                windowHeight = $window.innerHeight,
                scrollTop = $window.pageYOffset;

            // First, check if there is a need to scroll: scroll if the sidebar is smaller then the content
            if (sidebarHeight < $('.col1').height()) {
                if ((scrollTop + marginTop + sidebarHeight) > (documentHeight - marginBottom)) {
                    // Stick to the bottom
                    var bottom = marginBottom + scrollTop + windowHeight - documentHeight;
                    sidebar.css({'position': 'fixed', 'top': '', 'bottom': bottom});
                } else if ((scrollTop + marginTop) > sidebarMinOffset) {
                    // scroll with the user
                    sidebar.css({'position': 'fixed', 'top': marginTop, 'bottom': ''});
                } else {
                    // Stick to the top
                    sidebar.css({'position': 'relative', 'top': 0, 'bottom': ''});
                }
            } else {
                // Stick to the top, if the sidebar is larger then the content
                sidebar.css({'position': 'relative', 'top': 0, 'bottom': ''});
            }
        };

        $scope.initSidebar = function () {
            sidebar = $('#sidebar');
            $scope.$watch(function () {
                return sidebar.height();
            }, sidebarScroll);
            angular.element($window).bind('scroll', sidebarScroll);
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
    'MajorityMethodChoices',
    'Config',
    'configOptions',
    'gettextCatalog',
    'DateTimePickerTranslation',
    function($scope, MajorityMethodChoices, Config, configOptions, gettextCatalog, DateTimePickerTranslation) {
        Config.bindAll({}, $scope, 'configs');
        $scope.configGroups = configOptions.data.config_groups;
        $scope.dateTimePickerTranslatedButtons = DateTimePickerTranslation.getButtons();

        // save changed config value
        $scope.save = function(key, value) {
            Config.get(key).value = value;
            Config.save(key);
        };

        // For comments input
        $scope.addComment = function (key, parent) {
            parent.value.push({
                name: gettextCatalog.getString('New'),
                public: false,
            });
            $scope.save(key, parent.value);
        };
        $scope.removeComment = function (key, parent, index) {
            parent.value.splice(index, 1);
            $scope.save(key, parent.value);
        };

        // For majority method
        angular.forEach(
            _.filter($scope.configGroups, function (configGroup) {
                return configGroup.name === 'Motions' || configGroup.name === 'Elections';
            }),
            function (configGroup) {
                var configItem;
                _.forEach(configGroup.subgroups, function (subgroup) {
                    configItem = _.find(subgroup.items, ['input_type', 'majorityMethod']);
                    if (configItem !== undefined) {
                        // Break the forEach loop if we found something.
                        return false;
                    }
                });
                if (configItem !== undefined) {
                    configItem.choices = MajorityMethodChoices;
                }
            }
        );
    }
])

// Search Bar Controller
.controller('SearchBarCtrl', [
    '$scope',
    '$state',
    '$sanitize',
    function ($scope, $state, $sanitize) {
        $scope.search = function() {
            var query = _.escape($scope.querybar);
            $scope.querybar = '';
            $state.go('search', {q: query});
        };
    }
])

// Search Controller
.controller('SearchCtrl', [
    '$scope',
    '$http',
    '$stateParams',
    '$location',
    '$sanitize',
    'DS',
    function ($scope, $http, $stateParams, $location, $sanitize, DS) {
        $scope.fullword = false;
        $scope.filterAgenda = true;
        $scope.filterMotion = true;
        $scope.filterAssignment = true;
        $scope.filterUser = true;
        $scope.filterMedia = true;

        // search function
        $scope.search = function() {
            var query = _.escape($scope.query);
            if (query !== '') {
                var lastquery = query;
                // attach asterisks if search is not for full words only
                if (!$scope.fullword) {
                    if (query.charAt(0) != '*'){
                        query = "*" + query;
                    }
                    if (query.charAt(query.length - 1) != '*'){
                        query = query + "*";
                    }
                }
                $scope.query = lastquery;
                $http.get('/core/search_api/?q=' + query).then(function(success) {
                    $scope.results = [];
                    var elements = success.data.elements;
                    angular.forEach(elements, function(element) {
                        DS.find(element.collection, element.id).then(function(data) {
                            data.urlState = element.collection.replace('/','.')+'.detail';
                            data.urlParam = {id: element.id};
                            $scope.results.push(data);
                        });
                    });
                });
                $location.url('/search/?q=' + lastquery);
            }
        };

        //get search string from parameters submitted from outside the scope
        if ($stateParams.q) {
            $scope.query = $stateParams.q;
            $scope.search();
        }

        // returns element if part of the current search selection
        $scope.filterresult = function() {
            return function(result) {
                if ($scope.filterUser && result.urlState == 'users.user.detail') {
                    return result;
                }
                if ($scope.filterMotion && result.urlState == 'motions.motion.detail') {
                    return result;
                }
                if ($scope.filterAgenda && result.urlState == 'topics.topic.detail') {
                    return result;
                }
                if ($scope.filterAssignment && result.urlState == 'assignments.assignment.detail') {
                    return result;
                }
                if ($scope.filterMedia && result.urlState== 'mediafiles.mediafile.detail') {
                    return result;
                }
                return;
            };
        };
    }
])

// Projector Control Controller
.controller('ProjectorControlCtrl', [
    '$scope',
    '$http',
    '$interval',
    '$state',
    '$q',
    'Config',
    'Projector',
    'CurrentListOfSpeakersItem',
    'ListOfSpeakersOverlay',
    'ProjectionDefault',
    function($scope, $http, $interval, $state, $q, Config, Projector, CurrentListOfSpeakersItem, ListOfSpeakersOverlay, ProjectionDefault) {
        $scope.countdowns = [];
        $scope.highestCountdownIndex = 0;
        $scope.messages = [];
        $scope.highestMessageIndex = 0;
        $scope.listofspeakers = ListOfSpeakersOverlay;

        var cancelIntervalTimers = function () {
            $scope.countdowns.forEach(function (countdown) {
                $interval.cancel(countdown.interval);
            });
        };

        // Get all message and countdown data from the defaultprojector (id=1)
        var rebuildAllElements = function () {
            $scope.countdowns = [];
            $scope.messages = [];

            _.forEach(Projector.get(1).elements, function (element, uuid) {
                if (element.name == 'core/countdown') {
                    $scope.countdowns.push(element);

                    if (element.running) {
                        // calculate remaining seconds directly because interval starts with 1 second delay
                        $scope.calculateCountdownTime(element);
                        // start interval timer (every second)
                        element.interval = $interval(function () { $scope.calculateCountdownTime(element); }, 1000);
                    } else {
                        element.seconds = element.countdown_time;
                    }

                    if (element.index > $scope.highestCountdownIndex) {
                        $scope.highestCountdownIndex = element.index;
                    }
                } else if (element.name == 'core/message') {
                    $scope.messages.push(element);

                    if (element.index > $scope.highestMessageIndex) {
                        $scope.highestMessageIndex = element.index;
                    }
                }
            });
        };

        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            $scope.projectors = Projector.getAll();
            if (!$scope.active_projector) {
                $scope.changeProjector($scope.projectors[0]);
            }
            $scope.getDefaultOverlayProjector();
            // stop ALL interval timer
            cancelIntervalTimers();

            rebuildAllElements();
        });
        // gets the default projector where the current list of speakers overlay will be displayed
        $scope.getDefaultOverlayProjector = function () {
            var projectiondefault = ProjectionDefault.filter({name: 'agenda_current_list_of_speakers'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            } else {
                $scope.defaultProjectorId = 1;
            }
        };
        $scope.$on('$destroy', function() {
            // Cancel all intervals if the controller is destroyed
            cancelIntervalTimers();
        });

        // watch for changes in projector_broadcast and currentListOfSpeakersReference
        var last_broadcast;
        $scope.$watch(function () {
            return Config.lastModified();
        }, function () {
            var broadcast = Config.get('projector_broadcast').value;
            if (!last_broadcast || last_broadcast != broadcast) {
                last_broadcast = broadcast;
                $scope.broadcast = broadcast;
            }
            $scope.currentListOfSpeakersReference = $scope.config('projector_currentListOfSpeakers_reference');
        });

        $scope.changeProjector = function (projector) {
            $scope.active_projector = projector;
            $scope.scale = 256.0 / projector.width;
            $scope.iframeHeight = $scope.scale * projector.height;
        };

        $scope.editCurrentSlide = function (projector) {
            var state = projector.getStateForCurrentSlide();
            if (state) {
                $state.go(state.state, state.param);
            }
        };

        // *** countdown functions ***
        $scope.calculateCountdownTime = function (countdown) {
            countdown.seconds = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        };
        $scope.editCountdown = function (countdown) {
            countdown.editFlag = false;
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/countdown' && element.index == countdown.index) {
                        var data = {};
                        data[uuid] = {
                            "description": countdown.description,
                            "default_time": parseInt(countdown.default_time)
                        };
                        if (!countdown.running) {
                            data[uuid].countdown_time = parseInt(countdown.default_time);
                        }
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.addCountdown = function () {
            var default_time = parseInt($scope.config('projector_default_countdown'));
            $scope.highestCountdownIndex++;
            // select all projectors on creation, so write the countdown to all projectors
            $scope.projectors.forEach(function (projector) {
                $http.post('/rest/core/projector/' + projector.id + '/activate_elements/', [{
                    name: 'core/countdown',
                    countdown_time: default_time,
                    default_time: default_time,
                    visible: false,
                    selected: true,
                    index: $scope.highestCountdownIndex,
                    running: false,
                    stable: true,
                }]);
            });
        };
        $scope.removeCountdown = function (countdown) {
            $scope.projectors.forEach(function (projector) {
                var countdowns = [];
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/countdown' && element.index == countdown.index) {
                        $http.post('/rest/core/projector/' + projector.id + '/deactivate_elements/', [uuid]);
                    }
                });
            });
        };
        $scope.startCountdown = function (countdown) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/countdown' && element.index == countdown.index) {
                        var data = {};
                        // calculate end point of countdown (in seconds!)
                        var endTimestamp = Date.now() / 1000 - $scope.serverOffset + countdown.countdown_time;
                        data[uuid] = {
                            'running': true,
                            'countdown_time': endTimestamp
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.stopCountdown = function (countdown) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/countdown' && element.index == countdown.index) {
                        var data = {};
                        // calculate rest duration of countdown (in seconds!)
                        var newDuration = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
                        data[uuid] = {
                            'running': false,
                            'countdown_time': newDuration
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.resetCountdown = function (countdown) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/countdown' && element.index == countdown.index) {
                        var data = {};
                        data[uuid] = {
                            'running': false,
                            'countdown_time': countdown.default_time,
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };

        // *** message functions ***
        $scope.editMessage = function (message) {
            message.editFlag = false;
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/message' && element.index == message.index) {
                        var data = {};
                        data[uuid] = {
                            message: message.message,
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.addMessage = function () {
            $scope.highestMessageIndex++;
            // select all projectors on creation, so write the countdown to all projectors
            $scope.projectors.forEach(function (projector) {
                $http.post('/rest/core/projector/' + projector.id + '/activate_elements/', [{
                    name: 'core/message',
                    visible: false,
                    selected: true,
                    index: $scope.highestMessageIndex,
                    message: '',
                    stable: true,
                }]);
            });
        };
        $scope.removeMessage = function (message) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/message' && element.index == message.index) {
                        $http.post('/rest/core/projector/' + projector.id + '/deactivate_elements/', [uuid]);
                    }
                });
            });
        };

        /* project functions*/
        $scope.project = function (element) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (projectorElement, uuid) {
                    if (element.name == projectorElement.name && element.index == projectorElement.index) {
                        var data = {};
                        data[uuid] = {visible: !projectorElement.visible};
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.isProjected = function (element) {
            var projectorIds = [];
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (projectorElement, uuid) {
                    if (element.name == projectorElement.name && element.index == projectorElement.index) {
                        if (projectorElement.visible && projectorElement.selected) {
                            projectorIds.push(projector.id);
                        }
                    }
                });
            });
            return projectorIds;
        };
        $scope.isProjectedOn = function (element, projector) {
            var projectedIds = $scope.isProjected(element);
            return _.indexOf(projectedIds, projector.id) > -1;
        };
        $scope.hasProjector = function (element, projector) {
            var hasProjector = false;
            _.forEach(projector.elements, function (projectorElement, uuid) {
                if (element.name == projectorElement.name && element.index == projectorElement.index) {
                    if (projectorElement.selected) {
                        hasProjector = true;
                    }
                }
            });
            return hasProjector;
        };
        $scope.toggleProjector = function (element, projector) {
            _.forEach(projector.elements, function (projectorElement, uuid) {
                if (element.name == projectorElement.name && element.index == projectorElement.index) {
                    var data = {};
                    data[uuid] = {
                        'selected': !projectorElement.selected,
                    };
                    $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                }
            });
        };
        $scope.selectAll = function (element, value) {
            $scope.projectors.forEach(function (projector) {
                _.forEach(projector.elements, function (projectorElement, uuid) {
                    if (element.name == projectorElement.name && element.index == projectorElement.index) {
                        var data = {};
                        data[uuid] = {
                            'selected': value,
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };

        $scope.preventClose = function (e) {
            e.stopPropagation();
        };

        /* go to the list of speakers(management) of the currently displayed list of speakers reference slide*/
        $scope.goToListOfSpeakers = function() {
            CurrentListOfSpeakersItem.getItem($scope.currentListOfSpeakersReference).then(function (success) {
                $state.go('agenda.item.detail', {id: success.id});
            });
        };
    }
])

.controller('ManageProjectorsCtrl', [
    '$scope',
    '$http',
    '$state',
    '$timeout',
    'Projector',
    'ProjectionDefault',
    'Config',
    'gettextCatalog',
    function ($scope, $http, $state, $timeout, Projector, ProjectionDefault, Config, gettextCatalog) {
        ProjectionDefault.bindAll({}, $scope, 'projectiondefaults');

        // watch for changes in projector_broadcast
        // and projector_currentListOfSpeakers_reference
        var last_broadcast, last_clos;
        $scope.$watch(function () {
            return Config.lastModified();
        }, function () {
            var broadcast = $scope.config('projector_broadcast'),
            currentListOfSpeakers = $scope.config('projector_currentListOfSpeakers_reference');
            if (!last_broadcast || last_broadcast != broadcast) {
                last_broadcast = broadcast;
                $scope.broadcast = broadcast;
            }
            if (!last_clos || last_clos != currentListOfSpeakers) {
                last_clos = currentListOfSpeakers;
                $scope.currentListOfSpeakers = currentListOfSpeakers;
            }
        });

        // watch for changes in Projector, and recalc scale and iframeHeight
        var first_watch = true;
        $scope.resolutions = [];
        $scope.edit = [];
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            $scope.projectors = Projector.getAll();
            $scope.projectors.forEach(function (projector) {
                projector.iframeScale = 256.0 / projector.width;
                projector.iframeHeight = projector.iframeScale * projector.height;
                if (first_watch) {
                    $scope.resolutions[projector.id] = {
                        width: projector.width,
                        height: projector.height
                    };
                    $scope.edit[projector.id] = false;
                }
            });
            if ($scope.projectors.length) {
                first_watch = false;
            }
        });

        // Set list of speakers reference
        $scope.setListOfSpeakers = function (projector) {
            Config.get('projector_currentListOfSpeakers_reference').value = projector.id;
            Config.save('projector_currentListOfSpeakers_reference');
        };

        // Projector functions
        $scope.setProjectionDefault = function (projector, projectiondefault) {
            if (projectiondefault.projector_id !== projector.id) {
                $http.post('/rest/core/projector/' + projector.id + '/set_projectiondefault/', projectiondefault.id);
            }
        };
        $scope.createProjector = function (name) {
            var projector = {
                name: name,
                config: {},
                scale: 0,
                scroll: 0,
                blank: false,
                projectiondefaults: [],
            };
            Projector.create(projector).then(function (projector) {
                $http.post('/rest/core/projector/' + projector.id + '/activate_elements/', [{
                    name: 'core/clock',
                    stable: true
                }]);
                $scope.resolutions[projector.id] = {
                    width: projector.width,
                    height: projector.height
                };
            });
        };
        $scope.deleteProjector = function (projector) {
            if (projector.id != 1) {
                Projector.destroy(projector.id);
            }
        };
        $scope.editCurrentSlide = function (projector) {
            var state = projector.getStateForCurrentSlide();
            if (state) {
                $state.go(state.state, state.param);
            }
        };
        $scope.editName = function (projector) {
            projector.config = projector.elements;
            Projector.save(projector);
        };
        $scope.changeResolution = function (projectorId) {
            $http.post(
                '/rest/core/projector/' + projectorId + '/set_resolution/',
                $scope.resolutions[projectorId]
            ).then(function (success) {
                $scope.resolutions[projectorId].error = null;
            }, function (error) {
                $scope.resolutions[projectorId].error = error.data.detail;
            });
        };

        // Identify projectors
        $scope.identifyProjectors = function () {
            if ($scope.identifyPromise) {
                $timeout.cancel($scope.identifyPromise);
                $scope.removeIdentifierMessages();
            } else {
                $scope.projectors.forEach(function (projector) {
                    $http.post('/rest/core/projector/' + projector.id + '/activate_elements/', [{
                        name: 'core/message',
                        stable: true,
                        selected: true,
                        visible: true,
                        message: gettextCatalog.getString('Projector') + ' ' + projector.id + ': ' + projector.name,
                        type: 'identify'
                    }]);
                });
                $scope.identifyPromise = $timeout($scope.removeIdentifierMessages, 3000);
            }
        };
        $scope.removeIdentifierMessages = function () {
            Projector.getAll().forEach(function (projector) {
                angular.forEach(projector.elements, function (uuid, value) {
                    if (value.name == 'core/message' && value.type == 'identify') {
                        $http.post('/rest/core/projector/' + projector.id + '/deactivate_elements/', [uuid]);
                    }
                });
            });
            $scope.identifyPromise = null;
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

        $scope.clearChatHistory = function () {
            $http.post('/rest/core/chatmessage/clear/');
        };
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

// format time string for model ("m") and view format ("h:mm" or "hh:mm")
.directive('hourMinFormat', [
    function () {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (hh:mm) to model format (m)
                    var time = data.split(':');
                    if (time.length > 1 && !isNaN(time[0]) && !isNaN(time[1])) {
                        data = (+time[0]) * 60 + (+time[1]);
                        if (data < 0) {
                            data = "-"+data;
                        }
                    }
                    if (data === '') {
                        data = 0;
                    }
                    return data;
                });

                ngModelController.$formatters.push(function(totalminutes) {
                    //convert data from model format (m) to view format (hh:mm)
                    var time = "";
                    if (totalminutes < 0) {
                        time = "-";
                        totalminutes = -totalminutes;
                    }
                    var hh = Math.floor(totalminutes / 60);
                    var mm = Math.floor(totalminutes % 60);
                    // Add leading "0" for double digit values
                    mm = ("0"+mm).slice(-2);
                    time += hh + ":" + mm;
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

.filter('toArray', function(){
    /*
     * Transforms an object to an array. Items of the array are the values of
     * the object elements.
     */
    return function(obj) {
        var result = [];
        angular.forEach(obj, function(val, key) {
            result.push(val);
        });
        return result;
    };
})

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
        gettext('Predefined seconds of new countdowns');
        gettext('List of speakers overlay');
    }
]);

}());
