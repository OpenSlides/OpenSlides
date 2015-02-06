angular.module('OpenSlidesApp', [
    'ngRoute',
    'angular-data.DS',
    'ngCookies',
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.assignment',
    'OpenSlidesApp.user',
])

.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'static/templates/dashboard.html'
        })
        .otherwise({redirectTo: '/'});
    $locationProvider.html5Mode(true);
})

.run(function($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
    $http.defaults.headers.put['X-CSRFToken'] = $cookies.csrftoken;
})

.run(function(DS, autoupdate) {
    autoupdate.on_message(function(data) {
        // TODO: when MODEL.find() is called after this
        //       a new request is fired. This could be a bug in DS
        if (data.status_code == 200) {
            DS.inject(data.collection, data.data)
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
