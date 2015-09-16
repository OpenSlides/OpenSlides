"use strict";

// The core module used for the OpenSlides site and the projector
angular.module('OpenSlidesApp.core', [
    'angular-loading-bar',
    'js-data',
    'gettext',
    'ngAnimate',
    'ui.bootstrap',
    'ui.tree',
    'uiSwitch',
])

.config(['DSProvider', 'DSHttpAdapterProvider', function(DSProvider, DSHttpAdapterProvider) {
    // Reloads everything after 5 minutes.
    // TODO: * find a way only to reload things that are still needed
    DSProvider.defaults.maxAge = 5 * 60 * 1000;  // 5 minutes
    DSProvider.defaults.reapAction = 'none';
    DSProvider.defaults.basePath = '/rest';
    DSProvider.defaults.afterReap = function(model, items) {
        if (items.length > 5) {
            model.findAll({}, {bypassCache: true});
        } else {
            _.forEach(items, function (item) {
                model.refresh(item[model.idAttribute]);
            });
        }
    };
    DSHttpAdapterProvider.defaults.forceTrailingSlash = true;
}])

.factory('autoupdate', function() {
    var url = location.origin + "/sockjs";

    var Autoupdate = {
        socket: null,
        message_receivers: [],
        connect: function() {
            var autoupdate = this;
            this.socket = new SockJS(url);

            this.socket.onmessage = function(event) {
                _.forEach(autoupdate.message_receivers, function(receiver) {
                    receiver(event.data);
                });
            }

            this.socket.onclose = function() {
                setTimeout(autoupdate.connect, 5000);
            }
        },
        on_message: function(receiver) {
            this.message_receivers.push(receiver);
        }
    };
    Autoupdate.connect();
    return Autoupdate;
})

.run(['DS', 'autoupdate', function(DS, autoupdate) {
    autoupdate.on_message(function(data) {
        // TODO: when MODEL.find() is called after this
        //       a new request is fired. This could be a bug in DS

        // TODO: Do not send the status code to the client, but make the decission
        //       on the server side. It is an implementation detail, that tornado
        //       sends request to wsgi, which should not concern the client.
        console.log("Received object: " + data.collection + ", " + data.id);
        if (data.status_code == 200) {
            DS.inject(data.collection, data.data);
        } else if (data.status_code == 404) {
            DS.eject(data.collection, data.id);
        }
        // TODO: handle other statuscodes
    });
}])

.factory('loadGlobalData', [
    '$rootScope',
    'Config',
    'Projector',
    function ($rootScope, Config, Projector) {
        return function () {
            // Puts the config object into each scope.
            Config.findAll().then(function() {
                $rootScope.config = function(key) {
                    try {
                        return Config.get(key).value;
                    }
                    catch(err) {
                        console.log("Unkown config key: " + key);
                        return ''
                    }
                }
            });

            // Loads all projector data
            Projector.findAll();
        }
    }
])

// Load the global data on startup
.run([
    'loadGlobalData',
    function(loadGlobalData, operator) {
        loadGlobalData();
    }
])

.factory('jsDataModel', ['$http', 'Projector', function($http, Projector) {
    var BaseModel = function() {};
    BaseModel.prototype.project = function() {
        return $http.post(
            '/rest/core/projector/1/prune_elements/',
            [{name: this.getResourceName(), id: this.id}]
        );
    };
    BaseModel.prototype.isProjected = function() {
        // Returns true if there is a projector element with the same
        // name and the same id.
        var projector = Projector.get(1);
        if (typeof projector === 'undefined') return false;
        var self = this;
        var predicate = function (element) {
            return element.name == self.getResourceName() &&
                   typeof element.id !== 'undefined' &&
                   element.id == self.id;
        };
        return typeof _.findKey(projector.elements, predicate) === 'string';
    };
    return BaseModel;
}])

.factory('Customslide', ['DS', 'jsDataModel', function(DS, jsDataModel) {
    var name = 'core/customslide'
    return DS.defineResource({
        name: name,
        useClass: jsDataModel,
        methods: {
            getResourceName: function () {
                return name;
            },
        },
    });
}])

.factory('Tag', ['DS', function(DS) {
    return DS.defineResource({
        name: 'core/tag',
    });
}])

.factory('Config', ['DS', function(DS) {
    return DS.defineResource({
        name: 'core/config',
        idAttribute: 'key',
    });
}])

/* Model for a projector.
 *
 * At the moment we use only one projector, so there will be only one object
 * in this model. It has the id 1. For later releases there will be multiple
 * projector objects.
 *
 * This model uses onConfilict: 'replace' instead of 'merge'. This is necessary
 * because the keys of the projector objects can change and old keys have to
 * be removed. See http://www.js-data.io/docs/dsdefaults#onconflict for
 * more information.
 */
.factory('Projector', ['DS', function(DS) {
    return DS.defineResource({
        name: 'core/projector',
        onConflict: 'replace',
    });
}])

// Make sure that the DS factories are loaded by making them a dependency
.run(['Projector', 'Config', 'Tag', 'Customslide', function(Projector, Config, Tag, Customslide){}]);


// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'ui.router',
    'ngBootbox',
    'ngFabForm',
    'ngMessages',
    'ngCsvImport',
    'ngSanitize',  // TODO: only use this in functions that need it.
    'ui.select',
    'xeditable',
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
                    operator.onOperatorChange(function () {that.updateMainMenu()});
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
            }
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
    function (mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'dashboard',
            'img_class': 'home',
            'title': 'Home',
            'weight': 100,
        });

        mainMenuProvider.register({
            'ui_sref': 'core.customslide.list',
            'img_class': 'video-camera',
            'title': 'Projector',
            'weight': 110,
            'perm': 'core.can_see_projector',
        });

        mainMenuProvider.register({
            'ui_sref': 'config',
            'img_class': 'cog',
            'title': 'Settings',
            'weight': 1000,
            'perm': 'core.can_manage_config',
        });
    }
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
})

.config(function(uiSelectConfig) {
  uiSelectConfig.theme = 'bootstrap';
})

.config(function($stateProvider, $urlMatcherFactoryProvider) {
    // Make the trailing slash optional
    $urlMatcherFactoryProvider.strictMode(false)

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
                templateUrl = 'static/templates/' + patterns[0] + '/' + patterns[1] + '-form.html'
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
        return parent(state)
    });
})

.config(function($stateProvider, $locationProvider) {
    // Core urls
    $stateProvider
        .state('dashboard', {
            url: '/',
            templateUrl: 'static/templates/dashboard.html'
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
        // version
        .state('version', {
            url: '/version',
            controller: 'VersionCtrl',
        })
        //config
        .state('config', {
            url: '/config',
            controller: 'ConfigCtrl',
            resolve: {
                configOption: function($http) {
                    return $http({ 'method': 'OPTIONS', 'url': '/rest/core/config/' });
                }
            }
        })
        // customslide
        .state('core.customslide', {
            url: '/customslide',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('core.customslide.list', {
            resolve: {
                customslides: function(Customslide) {
                    return Customslide.findAll();
                }
            }
        })
        .state('core.customslide.create', {})
        .state('core.customslide.detail', {
            resolve: {
                customslide: function(Customslide, $stateParams) {
                    return Customslide.find($stateParams.id);
                }
            }
        })
        .state('core.customslide.detail.update', {
            views: {
                '@core.customslide': {}
            }
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
        .state('core.tag.detail.update', {
            views: {
                '@core.tag': {}
            }
        });

    $locationProvider.html5Mode(true);
})

// config for ng-fab-form
.config(function(ngFabFormProvider) {
    ngFabFormProvider.extendConfig({
        setAsteriskForRequiredLabel: true
    });
})

// Helper to add ui.router states at runtime.
// Needed for the django url_patterns.
.provider('runtimeStates', function($stateProvider) {
  this.$get = function($q, $timeout, $state) {
    return {
      addState: function(name, state) {
        $stateProvider.state(name, state);
      }
    }
  }
})

// Load the django url patterns
.run(function(runtimeStates, $http) {
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
})

// options for angular-xeditable
.run(function(editableOptions) {
    editableOptions.theme = 'bs3';
})


// html-tag os-form-field to generate generic from fields
// TODO: make it possible to use other fields then config fields
.directive('osFormField', function($parse, Config) {
    function getHtmlType(type) {
        return {
            string: 'text',
            integer: 'number',
            boolean: 'checkbox',
            choice: 'choice',
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
                $scope.choices = field.choices;
            }
            $scope.label = field.label;
            $scope.key = 'field-' + field.key;
            $scope.value = config.value;
            $scope.help_text = field.help_text;
        }
    }
})

.controller("MainMenuCtrl", [
    '$scope',
    'mainMenu',
    function ($scope, mainMenu) {
        mainMenu.registerScope($scope);
    }
])

.controller("LanguageCtrl", function ($scope, gettextCatalog) {
    // controller to switch app language
    // TODO: detect browser language for default language
    gettextCatalog.setCurrentLanguage('en');
    //TODO: for debug only! (helps to find untranslated strings by adding "[MISSING]:")
    gettextCatalog.debug = true;
    $scope.switchLanguage = function (lang) {
        gettextCatalog.setCurrentLanguage(lang);
        if (lang != 'en') {
            gettextCatalog.loadRemote("static/i18n/" + lang + ".json");
        }
    }
})

.controller("LoginFormCtrl", function ($scope, $modal) {
    $scope.open = function () {
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'LoginForm.html',
            controller: 'LoginFormModalCtrl',
            size: 'sm',
        });
    }
})

.controller('LoginFormModalCtrl', [
    '$scope',
    '$modalInstance',
    '$http',
    'operator',
    function ($scope, $modalInstance, $http, operator) {
        $scope.login = function () {
            $http.post(
                '/users/login/',
                {'username': $scope.username, 'password': $scope.password}
            ).success(function(data) {
                if (data.success) {
                    operator.setUser(data.user_id);
                    $scope.loginFailed = false;
                    $modalInstance.close();
                } else {
                    $scope.loginFailed = true;
                }
            });
        };
        $scope.guest = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
])

// Version Controller
.controller('VersionCtrl', function ($scope, $http) {
    $http.get('/core/version/').success(function(data) {
        $scope.core_version = data.openslides_version;
        $scope.plugins = data.plugins;
    });
})

// Config Controller
.controller('ConfigCtrl', function($scope, Config, configOption) {
    Config.bindAll({}, $scope, 'configs');
    $scope.configGroups = configOption.data.config_groups;

    // save changed config value
    $scope.save = function(key, value) {
        Config.get(key).value = value;
        Config.save(key);
    }
})

// Customslide Controller
.controller('CustomslideListCtrl', function($scope, Customslide) {
    Customslide.bindAll({}, $scope, 'customslides');

    // setup table sorting
    $scope.sortColumn = 'title';
    $scope.reverse = false;
    // function to sort by clicked column
    $scope.toggleSort = function ( column ) {
        if ( $scope.sortColumn === column ) {
            $scope.reverse = !$scope.reverse;
        }
        $scope.sortColumn = column;
    };

    // save changed customslide
    $scope.save = function (customslide) {
        Customslide.save(customslide);
    };
    $scope.delete = function (customslide) {
        //TODO: add confirm message
        Customslide.destroy(customslide.id).then(
            function(success) {
                //TODO: success message
            }
        );
    };
})

.controller('CustomslideDetailCtrl', function($scope, Customslide, customslide) {
    Customslide.bindOne(customslide.id, $scope, 'customslide');
})

.controller('CustomslideCreateCtrl', function($scope, $state, Customslide) {
    $scope.customslide = {};
    $scope.save = function (customslide) {
        Customslide.create(customslide).then(
            function(success) {
                $state.go('core.customslide.list');
            }
        );
    };
})

.controller('CustomslideUpdateCtrl', function($scope, $state, Customslide, customslide) {
    $scope.customslide = customslide;
    $scope.save = function (customslide) {
        Customslide.save(customslide).then(
            function(success) {
                $state.go('core.customslide.list');
            }
        );
    };
})

// Tag Controller
.controller('TagListCtrl', function($scope, Tag) {
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
        //TODO: add confirm message
        Tag.destroy(tag.id).then(
            function(success) {
                //TODO: success message
            }
        );
    };
})

.controller('TagCreateCtrl', function($scope, $state, Tag) {
    $scope.tag = {};
    $scope.save = function (tag) {
        Tag.create(tag).then(
            function(success) {
                $state.go('core.tag.list');
            }
        );
    };
})

.controller('TagUpdateCtrl', function($scope, $state, Tag, tag) {
    $scope.tag = tag;
    $scope.save = function (tag) {
        Tag.save(tag).then(
            function(success) {
                $state.go('core.tag.list');
            }
        );
    };
})

.directive('osFocusMe', function ($timeout) {
    return {
        link: function (scope, element, attrs, model) {
            $timeout(function () {
                element[0].focus();
            });
        }
    };
});


// The core module for the OpenSlides projector
angular.module('OpenSlidesApp.core.projector', ['OpenSlidesApp.core'])

// Provider to register slides in a .config() statement.
.provider('slides', function() {
    var slidesMap = {};

    this.registerSlide = function(name, config) {
        slidesMap[name] = config;
        return this;
    };

    this.$get = function($templateRequest, $q) {
        var self = this;
        return {
            getElements: function(projector) {
                var elements = [];
                var factory = this;
                _.forEach(projector.elements, function(element) {
                    if (element.name in slidesMap) {
                        element.template = slidesMap[element.name].template;
                        elements.push(element);
                    } else {
                        console.log("Unknown slide: " + element.name);
                    }
                });
                return elements;
            }
        }
    };
})

.config(function(slidesProvider) {
    slidesProvider.registerSlide('core/customslide', {
        template: 'static/templates/core/slide_customslide.html',
    });

    slidesProvider.registerSlide('core/clock', {
        template: 'static/templates/core/slide_clock.html',
    });
})

.filter('osServertime',function() {
    return function(serverOffset) {
        var date = new Date();
        return date.setTime(date.getTime() - serverOffset);
    };
})

.controller('ProjectorCtrl', function($scope, Projector, slides) {
    Projector.find(1).then(function() {
        $scope.$watch(function () {
            return Projector.lastModified(1);
        }, function () {
            $scope.elements = [];
            _.forEach(slides.getElements(Projector.get(1)), function(element) {
                if (!element.error) {
                    $scope.elements.push(element);
                } else {
                    console.error("Error for slide " + element.name + ": " + element.error)
                }
            });
        });
    });
})

.controller('SlideCustomSlideCtrl', function($scope, Customslide) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.id;
    Customslide.find(id);
    Customslide.bindOne(id, $scope, 'customslide');
})

.controller('SlideClockCtrl', function($scope) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    $scope.serverOffset = Date.parse(new Date().toUTCString()) - $scope.element.context.server_time;
});
