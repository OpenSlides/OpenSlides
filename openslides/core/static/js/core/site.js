(function () {

'use strict';

// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'OpenSlidesApp.core.start',
    'OpenSlidesApp.core.csv',
    'OpenSlidesApp.poll.majority',
    'ui.router',
    'colorpicker.module',
    'formly',
    'formlyBootstrap',
    'localytics.directives',
    'ngBootbox',
    'ngDialog',
    'ngFileSaver',
    'ngMessages',
    'ngStorage',
    'ckeditor',
    'luegg.directives',
    'xeditable',
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
                    this.scope = scope;
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

// Provider to register a searchable module/app.
.provider('Search', [
    function() {
        var searchModules = [];

        this.register = function(module) {
            searchModules.push(module);
        };

        this.$get = [
            function () {
                return {
                    getAll: function () {
                        return searchModules;
                    }
                };
            }
        ];
    }
])

.run([
    'editableOptions',
    'gettext',
    function (editableOptions, gettext) {
        editableOptions.theme = 'bs3';
        editableOptions.cancelButtonAriaLabel = gettext('Cancel');
        editableOptions.cancelButtonTitle = gettext('Cancel');
        editableOptions.clearButtonAriaLabel = gettext('Clear');
        editableOptions.clearButtonTitle = gettext('Clear');
        editableOptions.submitButtonAriaLabel = gettext('Submit');
        editableOptions.submitButtonTitle = gettext('Submit');
    }
])

// Set up the activeAppTitle for the title from the webpage
.run([
    '$rootScope',
    'gettextCatalog',
    'operator',
    function ($rootScope, gettextCatalog, operator) {
        $rootScope.activeAppTitle = '';
        $rootScope.$on('$stateChangeSuccess', function(event, toState) {
            if (toState.data) {
                $rootScope.activeAppTitle = toState.data.title || '';
                $rootScope.baseViewPermissionsGranted = toState.data.basePerm ?
                    operator.hasPerms(toState.data.basePerm) : true;
            } else {
                $rootScope.activeAppTitle = '';
                $rootScope.baseViewPermissionsGranted = true;
            }
        });
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
    'gettext',
    function($stateProvider, $locationProvider, gettext) {
        // Core urls
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'static/templates/home.html',
                data: {
                    title: gettext('Home'),
                    basePerm: 'core.can_see_frontpage',
                },
            })
            .state('projector', {
                url: '/projector/{id:int}/',
                templateUrl: 'static/templates/projector-container.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('real-projector', {
                url: '/real-projector/{id:int}/',
                templateUrl: 'static/templates/projector.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('manage-projectors', {
                url: '/manage-projectors',
                templateUrl: 'static/templates/core/manage-projectors.html',
                controller: 'ManageProjectorsCtrl',
                data: {
                    title: gettext('Manage projectors'),
                    basePerm: 'core.can_manage_projector',
                },
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
                data: {
                    title: gettext('Legal notice'),
                },
            })

            //config
            .state('config', {
                url: '/config',
                controller: 'ConfigCtrl',
                resolve: {
                    configOptions: function(Config) {
                        return Config.getConfigOptions();
                    }
                },
                data: {
                    title: gettext('Settings'),
                    basePerm: 'core.can_manage_config',
                },
            })

            // search
            .state('search', {
                url: '/search?q',
                controller: 'SearchCtrl',
                templateUrl: 'static/templates/search.html',
                data: {
                    title: gettext('Search'),
                },
            })

            // tag
            .state('core.tag', {
                url: '/tag',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Tags'),
                    basePerm: 'core.can_manage_tags',
                },
            })
            .state('core.tag.list', {})
            .state('core.tag.create', {})
            .state('core.tag.detail', {
                resolve: {
                    tagId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            .state('core.tag.detail.update', {
                resolve: {
                    tagId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                },
                views: {
                    '@core.tag': {}
                }
            });

        $locationProvider.html5Mode(true);
    }
])

.config([
    '$sessionStorageProvider',
    function ($sessionStorageProvider) {
        $sessionStorageProvider.setKeyPrefix('OpenSlides');
    }
])

.factory('ProjectorMessageForm', [
    'Editor',
    'gettextCatalog',
    function (Editor, gettextCatalog) {
        return {
            getDialog: function (message) {
                return {
                    template: 'static/templates/core/projector-message-form.html',
                    controller: 'ProjectorMessageEditCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        projectorMessageId: function () {
                            return message.id;
                        }
                    },
                };
            },
            getFormFields: function () {
                return [
                    {
                        key: 'message',
                        type: 'editor',
                        templateOptions: {
                            label: gettextCatalog.getString('Message'),
                        },
                        data: {
                            ckeditorOptions: Editor.getOptions()
                        }
                    },
                ];
            },
        };
    }
])

/* This factory handles the filtering of the OS-data-tables. It contains
 * all logic needed for the table header filtering. Things to configure:
 * - multiselectFilters: A dict associating the filter name to a list (empty per default). E.g.
 *       { tag: [],
 *         category: [], }
 * - booleanFilters: A dict containing a dict for every filter. The value property is a must.
 *   For displaying properties like displayName, choiceYes and choiceNo could be usefull. E.g.
 *      { isPresent: {
 *          value: undefined,
 *          displayName: gettext('Is present'), } }
 * - propertyList, propertyFunctionList, propertyDict: See function getObjectQueryString
 */
.factory('osTableFilter', [
    '$sessionStorage',
    function ($sessionStorage) {
        var createInstance = function (tableName) {
            var self = {
                multiselectFilters: {},
                booleanFilters: {},
                filterString: '',
            };
            var existsStorageEntry = function () {
                return $sessionStorage[tableName];
            };
            var storage = existsStorageEntry();
            if (storage) {
                self = storage;
            }

            self.existsStorageEntry = existsStorageEntry;
            self.save = function () {
                $sessionStorage[tableName] = self;
            };
            self.areFiltersSet = function () {
                var areFiltersSet = _.find(self.multiselectFilters, function (filterList) {
                    return filterList.length > 0;
                });
                areFiltersSet = areFiltersSet || _.find(self.booleanFilters, function (filterDict) {
                    return filterDict.value !== undefined;
                });
                areFiltersSet = areFiltersSet || (self.filterString !== '');
                return areFiltersSet !== false;
            };
            self.reset = function () {
                _.forEach(self.multiselectFilters, function (filterList, filter) {
                    self.multiselectFilters[filter] = [];
                });
                _.forEach(self.booleanFilters, function (filterDict, filter) {
                    self.booleanFilters[filter].value = undefined;
                });
                self.filterString = '';
                self.save();
            };
            self.operateMultiselectFilter = function (filter, id, danger) {
                if (!danger) {
                    if (_.indexOf(self.multiselectFilters[filter], id) > -1) {
                        // remove id
                        self.multiselectFilters[filter].splice(_.indexOf(self.multiselectFilters[filter], id), 1);
                    } else {
                        // add id
                        self.multiselectFilters[filter].push(id);
                    }
                    self.save();
                }
            };
            /* Three things are could be given to create the query string:
             * - propertyList: Just a list of object's properties like ['title', 'name']
             * - propertyFunktionList: A list of functions returning a property (e.g. [function(motion) {return motion.getTitle();}] for retrieving the motions title)
             * - propertyDict: A dict association properties that are lists to functions on how to handle them.
             *   E.g.: {'tags': function (tag) {return tag.name;}, }
             *         The list of tags will be mapped with this function to a list of strings (tag names).
             */
            self.getObjectQueryString = function (obj) {
                var stringList = [];
                _.forEach(self.propertyList, function (property) {
                    stringList.push(obj[property]);
                });
                _.forEach(self.propertyFunctionList, function (fn) {
                    stringList.push(fn(obj));
                });
                _.forEach(self.propertyDict, function (idFunction, property) {
                    stringList.push(_.map(obj[property], idFunction).join(' '));
                });
                return stringList.join(' ');
            };
            return self;
        };

        return {
            createInstance: createInstance
        };
    }
])

/* This factory takes care of the sorting of OS-data-tables. Things to configure:
 * - column: the default column which is the list sorted by (e.g.
 *   instance.column='title')
 */
.factory('osTableSort', [
    function () {
        var createInstance = function () {
            var self = {
                column: '',
                reverse: false,
            };
            self.toggle = function (column) {
                if (self.column === column) {
                    self.reverse = !self.reverse;
                }
                self.column = column;
            };
            return self;
        };

        return {
            createInstance: createInstance
        };
    }
])

/*
 * This filter filters all items in an array. If the filterArray is empty, the
 * array is passed. The filterArray contains numbers of the multiselect, e. g. [1, 3, 4].
 * Then, all items in the array are passed, if the item_id (get with id_function) matches
 * one of the ids in filterArray. id_function could also return a list of ids. Example:
 * Item 1 has two tags with ids [1, 4]. filterArray == [3, 4] --> match
 *
 * If -1 is in the array items without an id will not be filtered. This is for implementing
 * a filter option like: "All items without a category"
 */
.filter('MultiselectFilter', [
    function () {
        return function (array, filterArray, idFunction) {
            if (filterArray.length === 0) {
                return array;
            }
            var itemsWithoutProperty = _.indexOf(filterArray, -1) > -1;
            return Array.prototype.filter.call(array, function (item) {
                var id = idFunction(item);
                if (typeof id === 'number') {
                    id = [id];
                } else if (id === null || !id.length) {
                    return itemsWithoutProperty;
                }
                return _.intersection(id, filterArray).length > 0;
            });
        };
    }
])

.filter('osFilter', [
    function () {
        return function (array, string, getFilterString) {
            if (!string) {
                return array;
            }
            return Array.prototype.filter.call(array, function (item) {
                return getFilterString(item).toLowerCase().indexOf(string.toLowerCase()) > -1;
            });
        };
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
        formlyConfig.setType({
          name: 'radio-buttons',
          templateUrl: 'static/templates/core/radio-buttons.html',
          wrapper: ['bootstrapHasError'],
          defaultOptions: {
            noFormControl: false
          }
        });
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
                markupText: 'editor',
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
                    $scope.save(field, $scope.value);
                };
            }
        };
    }
])

/* This directive provides a csv import template.
 * Papa Parse is used to parse the csv file. Accepted attributes:
 * * change:
 *   Callback if file changes. The one parameter is csv passing the parsed file
 * * config (optional):
 *   - accept: String with extensions: default '.csv .txt'
 *   - encodingOptions: List with encodings. Default ['UTF-8', 'ISO-8859-1']
 *   - parseConfig: a dict passed to PapaParse
 */
.directive('csvImport', [
    function () {
        return {
            restrict: 'E',
            templateUrl: 'static/templates/csv-import.html',
            scope: {
                change: '&',
                config: '=?',
            },
            controller: function ($scope, $element, $attrs, $location) {
                // set config if it is not given
                if (!$scope.config) {
                    $scope.config = {};
                }
                if (!$scope.config.parseConfig) {
                    $scope.config.parseConfig = {};
                }

                $scope.inputElement = angular.element($element[0].querySelector('#csvFileSelector'));

                // set accept and encoding
                $scope.accept = $scope.config.accept || '.csv';
                $scope.encodingOptions = $scope.config.encodingOptions || ['UTF-8'];
                $scope.encoding = $scope.encodingOptions[0];

                $scope.parse = function () {
                    var inputElement = $scope.inputElement[0];
                    if (!inputElement.files.length) {
                        $scope.change({csv: {data: {}}});
                    } else {
                        var parseConfig = _.defaults(_.clone($scope.config.parseConfig), {
                            delimiter: $scope.delimiter,
                            encoding: $scope.encoding,
                            header: false, // we do not want to have dicts in result
                            complete: function (csv) {
                                csv.data = csv.data.splice(1); // do not interpret the header as data
                                $scope.$apply(function () {
                                    if (csv.meta.delimiter) {
                                        $scope.autodelimiter = csv.meta.delimiter;
                                    }
                                    $scope.change({csv: csv});
                                });
                            },
                            error: function () {
                                $scope.$apply(function () {
                                    $scope.change({csv: {data: {}}});
                                });
                            },
                        });

                        Papa.parse(inputElement.files[0], parseConfig);
                    }
                };

                $scope.clearFile = function () {
                    $scope.inputElement[0].value = '';
                    $scope.selectedFile = undefined;
                    $scope.parse();
                };

                $scope.inputElement.on('change', function () {
                    $scope.selectedFile = _.last($scope.inputElement[0].value.split('\\'));
                    $scope.parse();
                });
            },
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
    '$timeout',
    'MajorityMethodChoices',
    'Config',
    'configOptions',
    'gettextCatalog',
    'DateTimePickerTranslation',
    'Editor',
    function($scope, $timeout, MajorityMethodChoices, Config, configOptions,
        gettextCatalog, DateTimePickerTranslation, Editor) {
        Config.bindAll({}, $scope, 'configs');
        $scope.configGroups = configOptions.data.config_groups;
        $scope.dateTimePickerTranslatedButtons = DateTimePickerTranslation.getButtons();

        $scope.ckeditorOptions = Editor.getOptions();
        $scope.ckeditorOptions.on.change = function (event) {
            // we could just retrieve the key, but we need the configOption object.
            var configOption_key = event.editor.element.$.id;

            // find configOption object
            var subgroups = _.flatMap($scope.configGroups, function (group) {
                return group.subgroups;
            });
            var items = _.flatMap(subgroups, function (subgroup) {
                return subgroup.items;
            });
            var configOption = _.find(items, function (_item) {
                return _item.key === configOption_key;
            });

            var editor = this;
            // The $timeout executes the given function in an angular context. Because
            // this is a standard JS event, all changes may not happen in the digist-cylce.
            // By using $timeout angular calls $apply for us that we do not have to care
            // about starting the digist-cycle.
            $timeout(function () {
                $scope.save(configOption, editor.getData());
            }, 1);
        };

        // save changed config value
        $scope.save = function(configOption, value) {
            Config.get(configOption.key).value = value;
            Config.save(configOption.key).then(function (success) {
                configOption.success = true;
                // fade out the success symbol after 2 seconds.
                $timeout(function () {
                    var element = $('#success-field-' + configOption.key);
                    element.fadeOut(800, function () {
                        configOption.success = void 0;
                    });
                }, 2000);
            }, function (error) {
                configOption.success = false;
                configOption.errorMessage = error.data.detail;
            });
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
    '$filter',
    '$stateParams',
    'Search',
    'DS',
    'Motion',
    function ($scope, $filter, $stateParams, Search, DS, Motion) {
        $scope.searchresults = [];
        var searchModules = Search.getAll();

        // search function
        $scope.search = function() {
            $scope.results = [];
            var foundObjects = [];
            // search in rest properties of all defined searchModule
            // (does not found any related objects, e.g. speakers of items)
            _.forEach(searchModules, function(searchModule) {
                var result = {};
                result.verboseName = searchModule.verboseName;
                result.collectionName = searchModule.collectionName;
                result.urlDetailState = searchModule.urlDetailState;
                result.weight = searchModule.weight;
                result.checked = true;
                result.elements = $filter('filter')(DS.getAll(searchModule.collectionName), $scope.searchquery);
                $scope.results.push(result);
                _.forEach(result.elements, function(element) {
                    foundObjects.push(element);
                });
            });
            // search additionally in specific releations of all defined searchModules
            _.forEach(searchModules, function(searchModule) {
                _.forEach(DS.getAll(searchModule.collectionName), function(object) {
                    if (_.isFunction(object.hasSearchResult)) {
                        if (object.hasSearchResult(foundObjects, $scope.searchquery)) {
                            // releation found, check if object is not yet in search results
                            _.forEach($scope.results, function(result) {
                                if ((object.getResourceName() === result.collectionName) &&
                                        _.findIndex(result.elements, {'id': object.id}) === -1) {
                                    result.elements.push(object);
                                }
                            });
                        }
                    } else {
                        return false;
                    }
                });
            });
        };

        //get search string from parameters submitted from outside the scope
        if ($stateParams.q) {
            $scope.searchquery = $stateParams.q;
            $scope.search();
        }
    }
])

// Projector Control Controller
.controller('ProjectorControlCtrl', [
    '$scope',
    '$http',
    '$interval',
    '$state',
    '$q',
    '$filter',
    'Config',
    'Projector',
    'CurrentListOfSpeakersItem',
    'CurrentListOfSpeakersSlide',
    'ProjectionDefault',
    'ProjectorMessage',
    'Countdown',
    'gettextCatalog',
    'ngDialog',
    'ProjectorMessageForm',
    function($scope, $http, $interval, $state, $q, $filter, Config, Projector, CurrentListOfSpeakersItem,
        CurrentListOfSpeakersSlide, ProjectionDefault, ProjectorMessage, Countdown, gettextCatalog,
        ngDialog, ProjectorMessageForm) {
        ProjectorMessage.bindAll({}, $scope, 'messages');

        var intervals = [];
        var calculateCountdownTime = function (countdown) {
            countdown.seconds = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        };
        var cancelIntervalTimers = function () {
            intervals.forEach(function (interval) {
                $interval.cancel(interval);
            });
        };
        $scope.$watch(function () {
            return Countdown.lastModified();
        }, function () {
            $scope.countdowns = Countdown.getAll();

            // stop ALL interval timer
            cancelIntervalTimers();
            $scope.countdowns.forEach(function (countdown) {
                if (countdown.running) {
                    calculateCountdownTime(countdown);
                    intervals.push($interval(function () { calculateCountdownTime(countdown); }, 1000));
                } else {
                    countdown.seconds = countdown.countdown_time;
                }
            });
        });
        $scope.$on('$destroy', function() {
            // Cancel all intervals if the controller is destroyed
            cancelIntervalTimers();
        });

        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            $scope.projectors = Projector.getAll();
            if (!$scope.active_projector) {
                $scope.changeProjector($filter('orderBy')($scope.projectors, 'id')[0]);
            }
            if ($scope.projectors.length === 1) {
                $scope.currentListOfSpeakersAsOverlay = true;
            }

            $scope.messageDefaultProjectorId = ProjectionDefault.filter({name: 'messages'})[0].projector_id;
            $scope.countdownDefaultProjectorId = ProjectionDefault.filter({name: 'countdowns'})[0].projector_id;
            $scope.listOfSpeakersDefaultProjectorId = ProjectionDefault.filter({name: 'agenda_current_list_of_speakers'})[0].projector_id;
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
            countdown.description = countdown.new_description;
            Countdown.save(countdown);
            if (!countdown.running) {
                countdown.reset();
            }
        };
        $scope.addCountdown = function () {
            var default_time = parseInt($scope.config('projector_default_countdown'));
            var countdown = {
                description: '',
                default_time: default_time,
                countdown_time: default_time,
                running: false,
            };
            Countdown.create(countdown);
        };
        $scope.removeCountdown = function (countdown) {
            var isProjectedIds = countdown.isProjected();
            _.forEach(isProjectedIds, function(id) {
                countdown.project(id);
            });
            Countdown.destroy(countdown.id);
        };

        // *** message functions ***
        $scope.editMessage = function (message) {
            ngDialog.open(ProjectorMessageForm.getDialog(message));
        };
        $scope.addMessage = function () {
            var message = {message: ''};
            ProjectorMessage.create(message);
        };
        $scope.removeMessage = function (message) {
            var isProjectedIds = message.isProjected();
            _.forEach(isProjectedIds, function(id) {
                message.project(id);
            });
            ProjectorMessage.destroy(message.id);
        };

        /* Current list of speakers */
        $scope.currentListOfSpeakers = CurrentListOfSpeakersSlide;
        // Set the current overlay status
        if ($scope.currentListOfSpeakers.isProjected().length) {
            var isProjected = $scope.currentListOfSpeakers.isProjectedWithOverlayStatus();
            $scope.currentListOfSpeakersAsOverlay = isProjected[0].overlay;
        } else {
            $scope.currentListOfSpeakersAsOverlay = true;
        }
        // go to the list of speakers(management) of the currently displayed list of speakers reference slide
        $scope.goToListOfSpeakers = function() {
            var item = $scope.currentListOfSpeakersItem();
            if (item) {
                $state.go('agenda.item.detail', {id: item.id});
            }
        };
        $scope.currentListOfSpeakersItem = function () {
            return CurrentListOfSpeakersItem.getItem($scope.currentListOfSpeakersReference);
        };
        $scope.setOverlay = function (overlay) {
            $scope.currentListOfSpeakersAsOverlay = overlay;
            var isProjected = $scope.currentListOfSpeakers.isProjectedWithOverlayStatus();
            if (isProjected.length) {
                _.forEach(isProjected, function (mapping) {
                    if (mapping.overlay != overlay) { // change the overlay if it is different
                        $scope.currentListOfSpeakers.project(mapping.projectorId, overlay);
                    }
                });
            }
        };
    }
])

.controller('ProjectorMessageEditCtrl', [
    '$scope',
    'projectorMessageId',
    'ProjectorMessage',
    'ProjectorMessageForm',
    function ($scope, projectorMessageId, ProjectorMessage, ProjectorMessageForm) {
        $scope.formFields = ProjectorMessageForm.getFormFields();
        $scope.model = angular.copy(ProjectorMessage.get(projectorMessageId));

        $scope.save = function (message) {
            ProjectorMessage.inject(message);
            ProjectorMessage.save(message);
            $scope.closeThisDialog();
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
    'ProjectorMessage',
    function ($scope, $http, $state, $timeout, Projector, ProjectionDefault, Config, ProjectorMessage) {
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
                // Create new Message
                var message = {
                    message: '',
                };
                ProjectorMessage.create(message).then(function(message){
                    $scope.projectors.forEach(function (projector) {
                        $http.post('/rest/core/projector/' + projector.id + '/activate_elements/', [{
                            name: 'core/projectormessage',
                            stable: true,
                            id: message.id,
                            identify: true,
                        }]);
                    });
                    $scope.identifierMessage = message;
                });
                $scope.identifyPromise = $timeout($scope.removeIdentifierMessages, 3000);
            }
        };
        $scope.removeIdentifierMessages = function () {
            Projector.getAll().forEach(function (projector) {
                _.forEach(projector.elements, function (element, uuid) {
                    if (element.name == 'core/projectormessage' && element.id == $scope.identifierMessage.id) {
                        $http.post('/rest/core/projector/' + projector.id + '/deactivate_elements/', [uuid]);
                    }
                });
            });
            ProjectorMessage.destroy($scope.identifierMessage.id);
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
    'tagId',
    function($scope, Tag, tagId) {
        Tag.bindOne(tagId, $scope, 'tag');
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
    'tagId',
    function($scope, $state, Tag, tagId) {
        $scope.tag = Tag.get(tagId);
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
    'HumanTimeConverter',
    function (HumanTimeConverter) {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (mm:ss) to model format (s)
                    return HumanTimeConverter.humanTimeToSeconds(data, {seconds: true});
                });

                ngModelController.$formatters.push(function(data) {
                    //convert data from model format (s) to view format (mm:ss)
                    return HumanTimeConverter.secondsToHumanTime(data);
                });
            }
        };
    }
])

// format time string for model ("m") and view format ("h:mm" or "hh:mm")
.directive('hourMinFormat', [
    'HumanTimeConverter',
    function (HumanTimeConverter) {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (hh:mm) to model format (m)
                    return HumanTimeConverter.humanTimeToSeconds(data, {hours: true})/60;
                });

                ngModelController.$formatters.push(function(data) {
                    //convert data from model format (m) to view format (hh:mm)
                    return HumanTimeConverter.secondsToHumanTime(data*60,
                        { seconds: 'disabled',
                            hours: 'enabled' }
                    );
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
        gettext('Projector language');
        gettext('Current browser language');
        gettext('Show title and description of event on projector');
        gettext('Background color of projector header and footer');
        gettext('Font color of projector header and footer');
        gettext('Font color of projector headline');
        gettext('Predefined seconds of new countdowns');
        gettext('Color for blanked projector');
        gettext('List of speakers overlay');

        // Mark the string 'Default projector' here, because it does not appear in the templates.
        gettext('Default projector');
    }
]);

}());
