(function () {

'use strict';

// The core module used for the OpenSlides site and the projector
angular.module('OpenSlidesApp.core', [
    'js-data',
    'gettext',
    'ngAnimate',
    'ngSanitize',  // TODO: only use this in functions that need it.
    'ui.bootstrap',
    'ui.bootstrap.datetimepicker',
    'ui.tree',
    'pdf',
    'OpenSlidesApp-templates',
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
    'DSProvider',
    'DSHttpAdapterProvider',
    function(DSProvider, DSHttpAdapterProvider) {
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
    }
])

.factory('ProjectorID', [
    function () {
        return function () {
            return /projector\/(\d+)\//.exec(location.pathname)[1];
        };
    }
])

.factory('autoupdate', [
    'DS',
    '$rootScope',
    'REALM',
    'ProjectorID',
    function (DS, $rootScope, REALM, ProjectorID) {
        var socket = null;
        var recInterval = null;
        $rootScope.connected = false;

        var websocketProtocol;
        if (location.protocol == 'https:') {
            websocketProtocol = 'wss:';
        } else {
            websocketProtocol = 'ws:';
        }

        var websocketPath;
        if (REALM == 'site') {
          websocketPath = '/ws/site/';
        } else if (REALM == 'projector') {
          websocketPath = '/ws/projector/' + ProjectorID() + '/';
        } else {
          console.error('The constant REALM is not set properly.');
        }

        var Autoupdate = {
            messageReceivers: [],
            onMessage: function (receiver) {
                this.messageReceivers.push(receiver);
            },
            reconnect: function () {
                if (socket) {
                    socket.close();
                }
            }
        };
        var newConnect = function () {
            socket = new WebSocket(websocketProtocol + '//' + location.host + websocketPath);
            clearInterval(recInterval);
            socket.onopen = function () {
                $rootScope.connected = true;
            };
            socket.onclose = function () {
                $rootScope.connected = false;
                socket = null;
                recInterval = setInterval(function () {
                    newConnect();
                }, 1000);
            };
            socket.onmessage = function (event) {
                _.forEach(Autoupdate.messageReceivers, function (receiver) {
                    receiver(event.data);
                });
            };
        };

        newConnect();
        return Autoupdate;
    }
])

// gets all in OpenSlides available languages
.factory('Languages', [
    'gettext',
    'gettextCatalog',
    'OpenSlidesPlugins',
    function (gettext, gettextCatalog, OpenSlidesPlugins) {
        return {
            // get all available languages
            getLanguages: function () {
                var current = gettextCatalog.getCurrentLanguage();
                // Define here new languages...
                var languages = [
                    { code: 'en', name: gettext('English') },
                    { code: 'de', name: gettext('German') },
                    { code: 'fr', name: gettext('French') },
                    { code: 'es', name: gettext('Spanish') },
                    { code: 'pt', name: gettext('Portuguese') },
                    { code: 'cs', name: gettext('Czech') },
                ];
                angular.forEach(languages, function (language) {
                    if (language.code == current)
                        language.selected = true;
                });
                return languages;
            },
            // get detected browser language code
            getBrowserLanguage: function () {
                var lang = navigator.language || navigator.userLanguage;
                if (!navigator.language && !navigator.userLanguage) {
                    lang = 'en';
                } else {
                    if (lang.indexOf('-') !== -1)
                        lang = lang.split('-')[0];
                    if (lang.indexOf('_') !== -1)
                        lang = lang.split('_')[0];
                }
                return lang;
            },
            // set current language and return updated languages object array
            setCurrentLanguage: function (lang) {
                var languages = this.getLanguages();
                var plugins = OpenSlidesPlugins.getAll();
                angular.forEach(languages, function (language) {
                    language.selected = false;
                    if (language.code == lang) {
                        language.selected = true;
                        gettextCatalog.setCurrentLanguage(lang);
                        if (lang != 'en') {
                            gettextCatalog.loadRemote("static/i18n/" + lang + ".json");
                            // load language files from plugins
                            angular.forEach(plugins, function (plugin) {
                                if (plugin.languages.indexOf(lang) != -1) {
                                    gettextCatalog.loadRemote("static/i18n/" + plugin.name + '/' + lang + ".json");
                                }
                            });
                        }
                    }
                });
                return languages;
            }
        };
    }
])

// set browser language as default language for OpenSlides
.run([
    'gettextCatalog',
    'Languages',
    function(gettextCatalog, Languages) {
        // set detected browser language as default language (fallback: 'en')
        Languages.setCurrentLanguage(Languages.getBrowserLanguage());

        // Set this to true for debug. Helps to find untranslated strings by
        // adding "[MISSING]:".
        gettextCatalog.debug = false;
    }
])

.factory('dsEject', [
    'DS',
    function (DS) {
        return function (collection, instance) {
            var Resource = DS.definitions[collection];
            if (Resource.relationList) {
                Resource.relationList.forEach(function (relationDef) {
                    if (relationDef.foreignKey) {
                        var query = {};
                        query[relationDef.foreignKey] = instance[Resource.idAttribute];
                        Resource.getResource(relationDef.relation).ejectAll(query);
                    }
                });
            }
        };
    }
])

.run([
    'DS',
    'autoupdate',
    'dsEject',
    function (DS, autoupdate, dsEject) {
        autoupdate.onMessage(function(json) {
            // TODO: when MODEL.find() is called after this
            //       a new request is fired. This could be a bug in DS
            var dataList = [];
            try {
                 dataList = JSON.parse(json);
            } catch(err) {
                console.error(json);
            }
            _.forEach(dataList, function(data) {
                console.log("Received object: " + data.collection + ", " + data.id);
                var instance = DS.get(data.collection, data.id);
                if (data.action == 'changed') {
                    if (instance) {
                        // The instance is in the local db
                        dsEject(data.collection, instance);
                    }
                    DS.inject(data.collection, data.data);
                } else if (data.action == 'deleted') {
                    if (instance) {
                        // The instance is in the local db
                        dsEject(data.collection, instance);
                    }
                    DS.eject(data.collection, data.id);
                }
            });
        });
    }
])

// Save the server time to the rootscope.
.run([
    '$http',
    '$rootScope',
    function ($http, $rootScope) {
        // Loads server time and calculates server offset
        $rootScope.serverOffset = 0;
        $http.get('/core/servertime/')
        .then(function(data) {
            $rootScope.serverOffset = Math.floor(Date.now() / 1000 - data.data);
        });
    }
])

.run([
    'Config',
    '$rootScope',
    function (Config, $rootScope) {
        $rootScope.config = function (key) {
            try {
                return Config.get(key).value;
            }
            catch(err) {
                return '';
            }
        };
    }
])

// Make the indexOf available in every scope; needed for the projectorbuttons
.run([
    '$rootScope',
    function ($rootScope) {
        $rootScope.inArray = function (array, value) {
            return _.indexOf(array, value) > -1;
        };
    }
])

.factory('loadGlobalData', [
    'ChatMessage',
    'Config',
    'Projector',
    'ProjectorMessage',
    'Countdown',
    function (ChatMessage, Config, Projector, ProjectorMessage, Countdown) {
        return function () {
            Config.findAll();

            // Loads all projector data and the projectiondefaults
            Projector.findAll();
            ProjectorMessage.findAll();
            Countdown.findAll();

            // Loads all chat messages data and their user_ids
            // TODO: add permission check if user has required chat permission
            // error if include 'operator' here:
            // "Circular dependency found: loadGlobalData <- operator <- loadGlobalData"
            //if (operator.hasPerms("core.can_use_chat")) {
                ChatMessage.findAll().then( function(chatmessages) {
                    angular.forEach(chatmessages, function (chatmessage) {
                        ChatMessage.loadRelations(chatmessage, 'user');
                    });
                });
            //}
        };
    }
])


// Template hooks

.factory('templateHooks', [
    function () {
        var hooks = {};
        return {
            hooks: hooks,
            registerHook: function (hook) {
                if (hooks[hook.Id] === undefined) {
                    hooks[hook.Id] = [];
                }
                hooks[hook.Id].push(hook);
            }
        };
    }
])

.directive('templateHook', [
    '$compile',
    'templateHooks',
    function ($compile, templateHooks) {
        return {
            restrict: 'E',
            template: '',
            link: function (scope, iElement, iAttr) {
                var hooks = templateHooks.hooks[iAttr.hookName];
                var html;
                if (hooks) {
                    html = hooks.map(function (hook) {
                        return '<div>' + hook.template + '</div>';
                    }).join('');
                } else {
                    html = '';
                }
                iElement.append($compile(html)(scope));
            }
        };
    }
])

/*
 * This places a projector button in the document.
 *
 * Example: <projector-button model="motion" default-projector.id="defPrId"
 *           arg="2" content="{{ 'project' | translate }}"></projector-button>
 * This button references to model (in this example 'motion'). Also a defaultProjectionId
 * has to be given. In the example it's a scope variable. The next two parameters are additional:
 *   - arg: Then the model.project and model.isProjected will be called with
 *          this argument (e. g.: model.project(2))
 *   - content: A text placed behind the projector symbol.
 */
.directive('projectorButton', [
    'Projector',
    function (Projector) {
        return {
            restrict: 'E',
            templateUrl: 'static/templates/projector-button.html',
            link: function (scope, element, attributes) {
                if (!attributes.model) {
                    throw 'A model has to be given!';
                } else if (!attributes.defaultProjectorId) {
                    throw 'A default-projector-id has to be given!';
                }

                Projector.bindAll({}, scope, 'projectors');

                scope.$watch(attributes.model, function (model) {
                    scope.model = model;
                });

                scope.$watch(attributes.defaultProjectorId, function (defaultProjectorId) {
                    scope.defaultProjectorId = defaultProjectorId;
                });

                if (attributes.arg) {
                    scope.$watch(attributes.arg, function (arg) {
                        scope.arg = arg;
                    });
                }

                if (attributes.content) {
                    attributes.$observe('content', function (content) {
                        scope.content = content;
                    });
                }
            }
        };
    }
])

.factory('jsDataModel', [
    '$http',
    'Projector',
    function($http, Projector) {
        var BaseModel = function() {};
        BaseModel.prototype.project = function(projectorId) {
            // if this object is already projected on projectorId, delete this element from this projector
            var isProjectedIds = this.isProjected();
            _.forEach(isProjectedIds, function (id) {
                $http.post('/rest/core/projector/' + id + '/clear_elements/');
            });
            // Show the element, if it was not projected before on the given projector
            if (_.indexOf(isProjectedIds, projectorId) == -1) {
                return $http.post(
                    '/rest/core/projector/' + projectorId + '/prune_elements/',
                    [{name: this.getResourceName(), id: this.id}]
                );
            }
        };
        BaseModel.prototype.isProjected = function() {
            // Returns the ids of all projectors if there is a projector element
            // with the same name and the same id. Else returns an empty list.
            var self = this;
            var predicate = function (element) {
                return element.name == self.getResourceName() &&
                    typeof element.id !== 'undefined' &&
                    element.id == self.id;
            };
            var isProjectedIds = [];
            Projector.getAll().forEach(function (projector) {
                if (typeof _.findKey(projector.elements, predicate) === 'string') {
                    isProjectedIds.push(projector.id);
                }
            });
            return isProjectedIds;
        };
        return BaseModel;
    }
])

.factory('Tag', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'core/tag',
        });
    }
])

.factory('Config', [
    '$http',
    'DS',
    function($http, DS) {
        var configOptions;
        return DS.defineResource({
            name: 'core/config',
            idAttribute: 'key',
            configOptions: configOptions,
            getConfigOptions: function () {
                if (!this.configOptions) {
                    this.configOptions = $http({ 'method': 'OPTIONS', 'url': '/rest/core/config/' });
                }
                return this.configOptions;
            },
        });
    }
])

.factory('ChatMessage', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'core/chatmessage',
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'user',
                        localKey: 'user_id',
                    }
                }
            }
        });
    }
])

/*
 * Provides a function for plugins to register as new plugin.
 *
 * Get all registerd plugins via 'OpenSlidesPlugins.getAll()'.
 *
 * Example code for plugins:
 *
 *  .config([
 *      'OpenSlidesPluginsProvider',
 *       function(OpenSlidesPluginsProvider) {
 *          OpenSlidesPluginsProvider.registerPlugin({
 *              name: 'openslides_votecollector',
 *              display_name: 'VoteCollector',
 *              languages: ['de']
 *          });
 *      }
 *  ])
 */
.provider('OpenSlidesPlugins', [
    function () {
        var provider = this;
        provider.plugins = [];
        provider.registerPlugin = function (plugin) {
            provider.plugins.push(plugin);
        };
        provider.$get = [
            function () {
                return {
                    getAll: function () {
                        return provider.plugins;
                    }
                };
            }
        ];
    }
])

// Options for TinyMCE editor used in various create and edit views.
// Required in core/base.js because MotionComment factory which used this
// factory has to placed in motions/base.js.
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
                    browser_spellcheck: true,
                    image_advtab: true,
                    image_list: images,
                    plugins: [
                      'lists link autolink charmap preview searchreplace code fullscreen',
                      'paste textcolor colorpicker image imagetools wordcount'
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
.factory('Projector', [
    'DS',
    '$http',
    'Config',
    function(DS, $http, Config) {
        return DS.defineResource({
            name: 'core/projector',
            onConflict: 'replace',
            relations: {
                hasMany: {
                    'core/projectiondefault': {
                        localField: 'projectiondefaults',
                        foreignKey: 'projector_id',
                    }
                },
            },
            methods: {
                controlProjector: function(action, direction) {
                    $http.post('/rest/core/projector/' + this.id + '/control_view/',
                            {"action": action, "direction": direction}
                    );
                },
                getStateForCurrentSlide: function () {
                    var return_dict;
                    angular.forEach(this.elements, function(value, key) {
                        if (value.name == 'agenda/list-of-speakers') {
                            return_dict = {
                                'state': 'agenda.item.detail',
                                'param': {id: value.id}
                            };
                        } else if (
                            value.name != 'agenda/item-list' &&
                            value.name != 'core/clock' &&
                            value.name != 'core/countdown' &&
                            value.name != 'core/message' ) {
                            return_dict = {
                                'state': value.name.replace('/', '.')+'.detail.update',
                                'param': {id: value.id}
                            };
                        }
                    });
                    return return_dict;
                },
                toggleBlank: function () {
                    $http.post('/rest/core/projector/' + this.id + '/control_blank/',
                        !this.blank
                    );
                },
                toggleBroadcast: function () {
                    $http.post('/rest/core/projector/' + this.id + '/broadcast/');
                }
            },
        });
    }
])

/* Model for all projection defaults */
.factory('ProjectionDefault', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'core/projectiondefault',
            relations: {
                belongsTo: {
                    'core/projector': {
                        localField: 'projector',
                        localKey: 'projector_id',
                    }
                }
            }
        });
    }
])

/* Model for ProjectorMessages */
.factory('ProjectorMessage', [
    'DS',
    'jsDataModel',
    'gettext',
    '$http',
    'Projector',
    function(DS, jsDataModel, gettext, $http, Projector) {
        var name = 'core/projectormessage';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Message'),
            verbosenamePlural: gettext('Messages'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                // Override the BaseModel.project function
                project: function(projectorId) {
                    // if this object is already projected on projectorId, delete this element from this projector
                    var isProjectedIds = this.isProjected();
                    var self = this;
                    var predicate = function (element) {
                        return element.name == name && element.id == self.id;
                    };
                    _.forEach(isProjectedIds, function (id) {
                        var uuid = _.findKey(Projector.get(id).elements, predicate);
                        $http.post('/rest/core/projector/' + id + '/deactivate_elements/', [uuid]);
                    });
                    // if it was the same projector before, just delete it but not show again
                    if (_.indexOf(isProjectedIds, projectorId) == -1) {
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/activate_elements/',
                            [{name: name, id: self.id, stable: true}]
                        );
                    }
                },
            }
        });
    }
])

/* Model for Countdowns */
.factory('Countdown', [
    'DS',
    'jsDataModel',
    'gettext',
    '$rootScope',
    '$http',
    'Projector',
    function(DS, jsDataModel, gettext, $rootScope, $http, Projector) {
        var name = 'core/countdown';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Countdown'),
            verbosenamePlural: gettext('Countdowns'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                start: function () {
                    // calculate end point of countdown (in seconds!)
                    var endTimestamp = Date.now() / 1000 - $rootScope.serverOffset + this.countdown_time;
                    this.running = true;
                    this.countdown_time = endTimestamp;
                    DS.save(name, this.id);
                },
                stop: function () {
                    // calculate rest duration of countdown (in seconds!)
                    var newDuration = Math.floor( this.countdown_time - Date.now() / 1000 + $rootScope.serverOffset );
                    this.running = false;
                    this.countdown_time = newDuration;
                    DS.save(name, this.id);
                },
                reset: function () {
                    this.running = false;
                    this.countdown_time = this.default_time;
                    DS.save(name, this.id);
                },
                // Override the BaseModel.project function
                project: function(projectorId) {
                    // if this object is already projected on projectorId, delete this element from this projector
                    var isProjectedIds = this.isProjected();
                    var self = this;
                    var predicate = function (element) {
                        return element.name == name && element.id == self.id;
                    };
                    _.forEach(isProjectedIds, function (id) {
                        var uuid = _.findKey(Projector.get(id).elements, predicate);
                        $http.post('/rest/core/projector/' + id + '/deactivate_elements/', [uuid]);
                    });
                    // if it was the same projector before, just delete it but not show again
                    if (_.indexOf(isProjectedIds, projectorId) == -1) {
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/activate_elements/',
                            [{name: name, id: self.id, stable: true}]
                        );
                    }
                },
            },
        });
    }
])

/* Converts number of seconds into string "h:mm:ss" or "mm:ss" */
.filter('osSecondsToTime', [
    function () {
        return function (totalseconds) {
            var time;
            // floor returns the largest integer of the absolut value of totalseconds
            var total = Math.floor(Math.abs(totalseconds));
            var h = Math.floor(total / 3600);
            var mm = Math.floor(total % 3600 / 60);
            var ss = Math.floor(total % 60);
            var zero = "0";
            // Add leading "0" for double digit values
            mm = (zero+mm).slice(-2);
            ss = (zero+ss).slice(-2);
            if (h == "0")
                time =  mm + ':' + ss;
            else
                time = h + ":" + mm + ":" + ss;
            if (totalseconds < 0)
                time = "-"+time;
            return time;
        };
    }
])

/* Converts number of minutes into string "h:mm" or "hh:mm" */
.filter('osMinutesToTime', [
    function () {
        return function (totalminutes) {
            var time = '';
            if (totalminutes) {
                if (totalminutes < 0) {
                    time = "-";
                    totalminutes = -totalminutes;
                }
                var hh = Math.floor(totalminutes / 60);
                var mm = Math.floor(totalminutes % 60);
                // Add leading "0" for double digit values
                mm = ("0" + mm).slice(-2);
                time += hh + ":" + mm;
            }
            return time;
        };
    }
])

// mark HTML as "trusted"
.filter('trusted', [
    '$sce',
    function ($sce) {
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }
])

// filters the requesting object (id=selfid) from a list of input objects
.filter('notself', function() {
    return function(input, selfid) {
        var result;
        if (selfid) {
            result = [];
            for (var key in input){
                var obj = input[key];
                if (selfid != obj.id) {
                    result.push(obj);
                }
            }
        } else {
            result = input;
        }
        return result;
    };
})

// Make sure that the DS factories are loaded by making them a dependency
.run([
    'ChatMessage',
    'Config',
    'Countdown',
    'ProjectorMessage',
    'Projector',
    'ProjectionDefault',
    'Tag',
    function (ChatMessage, Config, Countdown, ProjectorMessage, Projector, ProjectionDefault, Tag) {}
]);

}());
