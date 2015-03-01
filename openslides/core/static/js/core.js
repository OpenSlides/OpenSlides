angular.module('OpenSlidesApp.core', [])

.config(function($stateProvider) {
    // Use stateProvider.decorator to give default values to our states
    $stateProvider.decorator('views', function(state, parent) {
        var result = {},
            views = parent(state);

        if (state.abstract) {
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
                    detail: '/:id',
                };

            defaultUrl = defaultUrls[_.last(patterns)];
        }

        state.url = state.url || defaultUrl;
        return parent(state)
    });
})

.config(function($stateProvider, $locationProvider) {
    // Core urls
    $stateProvider.state('dashboard', {
            url: '/',
            templateUrl: 'static/templates/dashboard.html'
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

.run(function($rootScope, i18n) {
    // Puts the gettext methods into each scope.
    // Uses the methods that are known by xgettext by default.
    methods = ['gettext', 'dgettext', 'dcgettext', 'ngettext', 'dngettext',
               'pgettext', 'dpgettext'];
    _.forEach(methods, function(method) {
        $rootScope[method] = _.bind(i18n[method], i18n);
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

.factory('i18n', function($http) {
    // TODO: there is a bug(?) in jed. I had to call val_idx++; in line 285
    // TODO: make the language variable and changeable at runtime
    var i18n = new Jed({
        'domain': 'de',
        'locale_data': {'de': {"": {}}},
    });  // TODO: use promise here
    $http.get('/static/i18n/de.json')
        .success(function(data) {
            // TODO: check data.
            i18n.options.locale_data['de'] = data;
        });
    return i18n;
})

.factory('Config', function(DS) {
    return DS.defineResource({
        name: 'config/config',
        idAttribute: 'key',
        endpoint: '/rest/config/config/'
    });
});
