(function () {

'use strict';

// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'ui.router',
    'formly',
    'formlyBootstrap',
    'ngBootbox',
    'ngMessages',
    'ngCsvImport',
    'ngSanitize',  // TODO: only use this in functions that need it.
    'ui.select',
    'luegg.directives',
    'xeditable',
    'ckeditor',
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

// Helper to add ui.router states at runtime.
// Needed for the django url_patterns.
.provider('runtimeStates', function($stateProvider) {
  this.$get = function($q, $timeout, $state) {
    return {
      addState: function(name, state) {
        $stateProvider.state(name, state);
      }
    };
  };
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

// angular formly config options
.run([
    'formlyConfig',
    function (formlyConfig) {
        // NOTE: This next line is highly recommended. Otherwise Chrome's autocomplete will appear over your options!
        formlyConfig.extras.removeChromeAutoComplete = true;

        // Configure custom types
        formlyConfig.setType({
          name: 'ui-select-single',
          extends: 'select',
          templateUrl: 'static/templates/core/ui-select-single.html'
        });
        formlyConfig.setType({
          name: 'ui-select-multiple',
          extends: 'select',
          templateUrl: 'static/templates/core/ui-select-multiple.html'
        });
    }
])

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
    };
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
    };
})

.controller("LoginFormCtrl", function ($scope, $modal) {
    $scope.open = function () {
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'LoginForm.html',
            controller: 'LoginFormModalCtrl',
            size: 'sm',
        });
    };
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
    };
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
    Customslide.loadRelations(customslide, 'agenda_item');
})

.controller('CustomslideCreateCtrl', [
    '$scope',
    '$state',
    'CKEditorOptions',
    'Customslide',
    function($scope, $state, CKEditorOptions, Customslide) {
        $scope.customslide = {};
        $scope.CKEditorOptions = CKEditorOptions;
        $scope.save = function (customslide) {
            Customslide.create(customslide).then(
                function(success) {
                    $state.go('core.customslide.list');
                }
            );
        };
    }
])

.controller('CustomslideUpdateCtrl', [
    '$scope',
    '$state',
    'CKEditorOptions',
    'Customslide',
    'customslide',
    function($scope, $state, CKEditorOptions, Customslide, customslide) {
        $scope.customslide = customslide;
        $scope.CKEditorOptions = CKEditorOptions;
        $scope.save = function (customslide) {
            Customslide.save(customslide).then(
                function(success) {
                    $state.go('core.customslide.list');
                }
            );
        };
    }
])

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

// counter of new (unread) chat messages
.value('NewChatMessages', [])

// ChatMessage Controller
.controller('ChatMessageCtrl', [
    '$scope',
    '$http',
    'ChatMessage',
    'NewChatMessages',
    function ($scope, $http, ChatMessage, NewChatMessages) {
        ChatMessage.bindAll({}, $scope, 'chatmessages');
        $scope.unreadMessages = NewChatMessages.length;
        $scope.chatboxIsCollapsed = true;
        $scope.openChatbox = function () {
            $scope.chatboxIsCollapsed = !$scope.chatboxIsCollapsed;
            NewChatMessages = [];
            $scope.unreadMessages = NewChatMessages.length;
        }
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
            })
            .error(function () {
                angular.element('#messageSendButton').removeClass('disabled');
                angular.element('#messageInput').removeAttr('disabled');
            });
        };
        // increment unread messages counter for each new message
        $scope.$watch('chatmessages', function (newVal, oldVal) {
            // add new message id if there is really a new message which is not yet tracked
            if ((oldVal[oldVal.length-1].id != newVal[newVal.length-1].id) &&
                ($.inArray(newVal[newVal.length-1].id, NewChatMessages) == -1)) {
                NewChatMessages.push(newVal[newVal.length-1].id);
                $scope.unreadMessages = NewChatMessages.length;
            }
        })
    }
])

.directive('osFocusMe', function ($timeout) {
    return {
        link: function (scope, element, attrs, model) {
            $timeout(function () {
                element[0].focus();
            });
        }
    };
});

}());
