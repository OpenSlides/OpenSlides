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
    '$http',
    'Config',
    'Projector',
    function ($rootScope, $http, Config, Projector) {
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

            // Loads server time and calculates server offset
            $http.get('/core/servertime/').then(function(data) {
                $rootScope.serverOffset = Math.floor( Date.now() / 1000 - data.data );
            });
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

/* Converts number of seconds into string "hh:mm:ss" or "mm:ss" */
.filter('osSecondsToTime', [
    function () {
        return function (totalseconds) {
            var time;
            var total = Math.abs(totalseconds);
            if (parseInt(totalseconds)) {
                var hh = Math.floor(total / 3600);
                var mm = Math.floor(total % 3600 / 60);
                var ss = Math.floor(total % 60);
                var zero = "0";
                // Add leading "0" for double digit values
                hh = (zero+hh).slice(-2);
                mm = (zero+mm).slice(-2);
                ss = (zero+ss).slice(-2);
                if (hh == "00")
                    time =  mm + ':' + ss;
                else
                    time = hh + ":" + mm + ":" + ss;
                if (totalseconds < 0)
                    time = "-"+time;
            } else {
                time = "--:--";
            }
            return time;
        };
    }
])
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
.controller('VersionCtrl', [
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
.controller('CustomslideListCtrl', [
    '$scope',
    '$http',
    'Customslide',
    function($scope, $http, Customslide) {
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
        }
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
        }

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
                if (value.name != 'core/clock' &&
                    value.name != 'core/countdown' &&
                    value.name != 'core/message' ) {
                    $state.go(value.name.replace('/', '.')+'.detail.update', {id: value.id });
                }
            });
        };
    }
])

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

    slidesProvider.registerSlide('core/countdown', {
        template: 'static/templates/core/slide_countdown.html',
    });

    slidesProvider.registerSlide('core/message', {
        template: 'static/templates/core/slide_message.html',
    });
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
            $scope.scroll = -10 * Projector.get(1).scroll;
            $scope.scale = 100 + 20 * Projector.get(1).scale;
        });
    });
})

.controller('SlideCustomSlideCtrl', [
    '$scope',
    'Customslide',
    function($scope, Customslide) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        Customslide.find(id);
        Customslide.bindOne(id, $scope, 'customslide');
    }
])

.controller('SlideClockCtrl', [
    '$scope',
    function($scope) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.servertime = ( Date.now() / 1000 - $scope.serverOffset ) * 1000;
    }
])

.controller('SlideCountdownCtrl', [
    '$scope',
    '$interval',
    function($scope, $interval) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.seconds = Math.floor( $scope.element.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        $scope.status = $scope.element.status;
        $scope.visible = $scope.element.visible;
        $scope.index = $scope.element.index;
        $scope.description = $scope.element.description;
        // start interval timer if countdown status is running
        var interval;
        if ($scope.status == "running") {
            interval = $interval( function() {
                $scope.seconds = Math.floor( $scope.element.countdown_time - Date.now() / 1000 + $scope.serverOffset );
            }, 1000);
        } else {
             $scope.seconds = $scope.element.countdown_time;
        }
        $scope.$on('$destroy', function() {
            // Cancel the interval if the controller is destroyed
            $interval.cancel(interval);
        });
    }
])

.controller('SlideMessageCtrl', [
    '$scope',
    function($scope) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.message = $scope.element.message;
        $scope.visible = $scope.element.visible;
    }
]);
