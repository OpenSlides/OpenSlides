angular.module('OpenSlidesApp.core', [])

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
            config.templateUrl = config.templateUrl || templateUrl;

            // controller
            if (patterns.length >= 3) {
                controller = _.capitalize(patterns[1]) + defaultControllers[_.last(patterns)];
                config.controller = config.controller || controller;
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
        .state('core', {
            url: '/core',
            abstract: true,
            template: "<ui-view/>",
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

.config(function(DSProvider) {
    // Reloads everything after 5 minutes.
    // TODO: * find a way only to reload things that are still needed
    DSProvider.defaults.maxAge = 5 * 60 * 1000;  // 5 minutes
    DSProvider.defaults.reapAction = 'none';
    DSProvider.defaults.afterReap = function(model, items) {
        if (items.length > 5) {
            model.findAll({}, {bypassCache: true});
        } else {
            _.forEach(items, function (item) {
                model.refresh(item[model.idAttribute]);
            });
        }
    };
})

// config for ng-fab-form
.config(function(ngFabFormProvider) {
    ngFabFormProvider.extendConfig({
        setAsteriskForRequiredLabel: true
    });
})

.provider('runtimeStates', function($stateProvider) {
  this.$get = function($q, $timeout, $state) {
    return {
      addState: function(name, state) {
        $stateProvider.state(name, state);
      }
    }
  }
})

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

.run(function(DS, autoupdate) {
    autoupdate.on_message(function(data) {
        // TODO: when MODEL.find() is called after this
        //       a new request is fired. This could be a bug in DS

        // TODO: Do not send the status code to the client, but make the decission
        //       on the server side. It is an implementation detail, that tornado
        //       sends request to wsgi, which should not concern the client.
        if (data.status_code == 200) {
            DS.inject(data.collection, data.data);
        } else if (data.status_code == 404) {
            DS.eject(data.collection, data.id);
        }
        // TODO: handle other statuscodes
    });
})

.run(function($rootScope, Config) {
    // Puts the config object into each scope.
    // TODO: maybe rootscope.config has to set before findAll() is finished
    Config.findAll().then(function() {;
        $rootScope.config = function(key) {
            return Config.get(key).value;
        }
    });
})

//options for angular-xeditable
.run(function(editableOptions) {
    editableOptions.theme = 'bs3';
})

.factory('autoupdate', function() {
    //TODO: use config here
    var url = "http://" + location.host + "/sockjs";

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

.factory('Customslide', function(DS) {
    return DS.defineResource({
        name: 'core/customslide',
        endpoint: '/rest/core/customslide/'
    });
})

.factory('Tag', function(DS) {
    return DS.defineResource({
        name: 'core/tag',
        endpoint: '/rest/core/tag/'
    });
})

.factory('Config', function(DS) {
    return DS.defineResource({
        name: 'config/config',
        idAttribute: 'key',
        endpoint: '/rest/config/config/'
    });
})

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

.controller('LoginFormModalCtrl', function ($scope, $modalInstance, $http, operator) {
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
})

.controller('TagListCtrl', function($scope, Tag) {
    Tag.bindAll({}, $scope, 'tags');

    // setup table sorting
    $scope.sortColumn = 'name';
    $scope.filterPresent = '';
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
