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
        $httpProvider.defaults.xsrfCookieName = 'OpenSlidesCsrfToken';
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
    'REALM',
    'ProjectorID',
    '$q',
    function (DS, REALM, ProjectorID, $q) {
        var socket = null;
        var recInterval = null;

        var websocketProtocol;
        if (location.protocol == 'https:') {
            websocketProtocol = 'wss:';
        } else {
            websocketProtocol = 'ws:';
        }

        var websocketPath;
        if (REALM === 'site') {
          websocketPath = '/ws/site/';
        } else if (REALM === 'projector') {
          websocketPath = '/ws/projector/' + ProjectorID() + '/';
        } else {
          console.error('The constant REALM is not set properly.');
        }

        var Autoupdate = {};
        Autoupdate.messageReceivers = [];
        // We use later a promise to defer the first message of the established ws connection.
        Autoupdate.firstMessageDeferred = $q.defer();
        Autoupdate.onMessage = function (receiver) {
            Autoupdate.messageReceivers.push(receiver);
        };
        Autoupdate.reconnect = function () {
            if (socket) {
                socket.close();
            }
        };
        Autoupdate.newConnect = function () {
            socket = new WebSocket(websocketProtocol + '//' + location.host + websocketPath);
            clearInterval(recInterval);
            socket.onclose = function () {
                socket = null;
                recInterval = setInterval(function () {
                    Autoupdate.newConnect();
                }, 1000);
            };
            socket.onmessage = function (event) {
                _.forEach(Autoupdate.messageReceivers, function (receiver) {
                    receiver(event.data);
                });
                // Check if the promise is not resolved yet.
                if (Autoupdate.firstMessageDeferred.promise.$$state.status === 0) {
                    Autoupdate.firstMessageDeferred.resolve();
                }
            };
        };
        return Autoupdate;
    }
])

.factory('operator', [
    'User',
    'Group',
    function (User, Group) {
        var operator = {
            user: null,
            perms: [],
            isAuthenticated: function () {
                return !!this.user;
            },
            setUser: function(user_id, user_data) {
                if (user_id && user_data) {
                    operator.user = User.inject(user_data);
                } else {
                    operator.user = null;
                }
            },
            // Returns true if the operator has at least one perm of the perms-list.
            hasPerms: function(perms) {
                if (typeof perms === 'string') {
                    perms = perms.split(' ');
                }
                return _.intersection(perms, operator.perms).length > 0;
            },
            reloadPerms: function () {
                if (operator.user) {
                    operator.perms = operator.user.getPerms();
                } else {
                    var defaultGroup = Group.get(1);
                    operator.perms = defaultGroup ? defaultGroup.permissions : [];
                }
            },
            // Returns true if the operator is a member of group.
            isInGroup: function(group) {
                return _.indexOf(operator.user.groups_id, group.id) > -1;
            },
        };
        return operator;
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
                    { code: 'en', name: 'English' },
                    { code: 'de', name: 'Deutsch' },
                    { code: 'fr', name: 'Français' },
                    { code: 'es', name: 'Español' },
                    { code: 'pt', name: 'Português' },
                    { code: 'cs', name: 'Čeština'},
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
                    if (relationDef.foreignKey && !relationDef.osProtectedRelation) {
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

            var dataListByCollection = _.groupBy(dataList, 'collection');
            _.forEach(dataListByCollection, function(list, key) {
                var changedElements = [];
                var deletedElements = [];
                var collectionString = key;
                _.forEach(list, function(data) {
                    // Uncomment this line for debugging to log all autoupdates:
                    // console.log("Received object: " + data.collection + ", " + data.id);

                    // remove (=eject) object from local DS store
                    var instance = DS.get(data.collection, data.id);
                    if (instance) {
                        dsEject(data.collection, instance);
                    }
                    // check if object changed or deleted
                    if (data.action === 'changed') {
                        changedElements.push(data.data);
                    } else if (data.action === 'deleted') {
                        deletedElements.push(data.id);
                    } else {
                        console.error('Error: Undefined action for received object' +
                            '(' + data.collection + ', ' + data.id + ')');
                    }
                });
                // add (=inject) all given objects into local DS store
                if (changedElements.length > 0) {
                    DS.inject(collectionString, changedElements);
                }
                // delete (=eject) all given objects from local DS store
                // (note: js-data does not provide 'bulk eject' as for DS.inject)
                _.forEach(deletedElements, function(id) {
                    DS.eject(collectionString, id);
                });
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
    'gettextCatalog',
    'DS',
    function($http, gettextCatalog, DS) {
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
            translate: function (value) {
                return gettextCatalog.getString(value);
            }
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


// Configs for CKEditor which has to set while startup of OpenSlides
.config(
    function() {
        CKEDITOR.disableAutoInline = true;
    }
)

// Options for CKEditor used in various create and edit views.
// Required in core/base.js because MotionComment factory which used this
// factory has to placed in motions/base.js.
.factory('Editor', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getOptions: function (images) {
                return {
                    on: {
                        instanceReady: function() {
                            // This adds a listener to ckeditor to remove unwanted blank lines on import.
                            // Clipboard content varies heavily in structure and html code, depending on the "sender".
                            // Here it is first parsed into a pseudo-DOM (two lines taken from a ckeditor
                            // paste example on the ckeditor site).
                            this.on('paste', function(evt) {
                                if (evt.data.type == 'html') {
                                    var fragment = CKEDITOR.htmlParser.fragment.fromHtml(evt.data.dataValue);
                                    var writer = new CKEDITOR.htmlParser.basicWriter();
                                    // html content will now be in a dom-like structure inside 'fragment'.
                                    this.filter.applyTo(fragment);
                                    if (fragment.children) {
                                        // If this fragment is DOM-like, it may contain nested properties
                                        // (being html nodes). Traverse the children and check if it is a
                                        // child only containing empty <br> or <p>.
                                        // new_content_children will finally contain all nodes that are
                                        // not empty.
                                        var new_content_children = [];
                                        _.forEach(fragment.children, function (child) {
                                            var empty = true;
                                            if (child.children){
                                                _.forEach(child.children, function(grandchild) {
                                                    if (grandchild.name != 'p' && grandchild.name != 'br') {
                                                        empty = false;
                                                    } else if (grandchild.isEmpty !== true) {
                                                        empty = false;
                                                    }
                                                });
                                                if (empty === false) {
                                                    new_content_children.push(child);
                                                }
                                            } else {
                                                if (child.name != 'p' && child.name != 'br' &&
                                                    child.isEmpty !== true){
                                                    new_content_children.push(child);
                                                }
                                            }
                                        });
                                        fragment.children = new_content_children;
                                    }
                                    fragment.writeHtml(writer);
                                    // Return the re-created fragment without the empty <p> and <br> into the
                                    // editor import processing (same as at the begin of the function: by ckeditor)
                                    evt.data.dataValue = writer.getHtml();
                                }
                            });
                        }
                    },
                    customConfig: '',
                    disableNativeSpellChecker: false,
                    language_list: [
                        'fr:français',
                        'es:español',
                        'pt:português',
                        'en:english',
                        'de:deutsch',
                        'cs:čeština'],
                    language: gettextCatalog.getCurrentLanguage(),
                    allowedContent:
                        'h1 h2 h3 b i u strike sup sub strong em;' +
                        'blockquote p pre table' +
                        '(text-align-left,text-align-center,text-align-right,text-align-justify){text-align};' +
                        'a[!href];' +
                        'img[!src,alt]{width,height,float};' +
                        'tr th td caption;' +
                        'li; ol[start]{list-style-type};' +
                        'ul{list-style};' +
                        'span[data-line-number,contenteditable]{color,background-color}(os-line-number,line-number-*);' +
                        'br(os-line-break);',

                    // there seems to be an error in CKeditor that parses spaces in extraPlugins as part of the plugin name.
                    extraPlugins: 'colorbutton,find,liststyle,sourcedialog,justify,showblocks',
                    removePlugins: 'wsc,scayt,a11yhelp,filebrowser,sourcearea',
                    removeButtons: 'Scayt,Anchor,Styles,HorizontalRule',
                    toolbarGroups: [
                        { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
                        { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
                        { name: 'links', groups: [ 'links' ] },
                        { name: 'insert', groups: [ 'insert' ] },
                        { name: 'tools', groups: [ 'tools' ] },
                        { name: 'document', groups: [ 'mode' ] },
                        '/',
                        { name: 'styles', groups: [ 'styles' ] },
                        { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
                        { name: 'colors', groups: [ 'colors' ] },
                        { name: 'paragraph', groups: [ 'list', 'indent' ] },
                        { name: 'align'},
                        { name: 'paragraph', groups: [ 'blocks' ] }
                    ]
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
                            value.name != 'core/message' &&
                            value.name != 'agenda/current-list-of-speakers' ) {
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
                        // Now check whether other messages are already projected and delete them
                        var elements = Projector.get(projectorId).elements;
                        _.forEach(elements, function (element, uuid) {
                            if (element.name === name) {
                                $http.post('/rest/core/projector/' + projectorId + '/deactivate_elements/', [uuid]);
                            }
                        });
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

/* Two functions to convert between time duration in seconds <-> human readable time span.
 * E.g. 90 sec <-> 1:30 (min), 3661 sec <-> 1:01:01 (h)
 *
 * secondsToHumanTime: Expects seconds and give [h*:]mm[:ss]. The minutes part is always given, the hours
 *      and minutes could be controlled. The default are forced seconds and hours just if it is not 0.
 *      - seconds ('enabled', 'auto', 'disabled'): Whether to show seconds (Default 'enabled')
 *      - hours ('enabled', 'auto', 'disabled'): Whether to show hours (Default 'auto')
 *
 * humanTimeToSeconds: Expects [h*:]m*[:s*] with each part could have a variable length. The parsed time is
 *      in seconds. Minutes have to be given and hours and seconds are optional. One have to set 'seconds' or
 *      'hours' to true toparse these.
 *
 * params could be an object with the given settings, e.g. {ignoreHours: true}
 */
.factory('HumanTimeConverter', [
    function () {
        return {
            secondsToHumanTime: function (seconds, params) {
                if (!params) {
                    params = {seconds: 'enabled', hours: 'auto'};
                }
                if (!params.seconds) {
                    params.seconds = 'enabled';

                }
                if (!params.hours) {
                    params.hours = 'auto';
                }
                var time;
                // floor returns the largest integer of the absolut value of seconds
                var total = Math.floor(Math.abs(seconds));
                var h = Math.floor(total / 3600);
                var m = Math.floor(total % 3600 / 60);
                var s = Math.floor(total % 60);
                // Add leading "0" for double digit values
                time = ('0'+m).slice(-2); //minutes
                if ((params.seconds == 'auto' && s > 0) || params.seconds == 'enabled') {
                    s = ('0'+s).slice(-2);
                    time =  time + ':' + s;
                }
                if ((params.hours == 'auto' && h > 0) || params.hours == 'enabled') {
                    time = h + ':' + time;
                }
                if (seconds < 0) {
                    time = '-'+time;
                }
                return time;
            },
            humanTimeToSeconds: function (data, params) {
                if (!params) {
                    params = {seconds: false, hours: false};
                }
                var minLength = 1;
                if (params.seconds) {
                    minLength++;
                }
                if (params.hours){
                    minLength++;
                }

                var negative = data.charAt(0) == '-';
                var time = data.split(':');
                data = 0;
                if (time.length >= minLength) {
                    for (var i = 0; i < minLength; i++) {
                        data = data*60 + (+time[i]);
                    }
                    if (!params.seconds) { // the last field was minutes (e.g. h:mm)
                        data *= 60;
                    }
                    if (negative) {
                        data = -data;
                    }
                }
                return data;
            },
        };
    }
])

/* Converts number of seconds into string "h:mm:ss" or "mm:ss" */
.filter('osSecondsToTime', [
    'HumanTimeConverter',
    function (HumanTimeConverter) {
        return function (seconds) {
            return HumanTimeConverter.secondsToHumanTime(seconds);
        };
    }
])

/* Converts number of minutes into string "h:mm" or "hh:mm" */
.filter('osMinutesToTime', [
    'HumanTimeConverter',
    function (HumanTimeConverter) {
        return function (minutes) {
            return HumanTimeConverter.secondsToHumanTime(minutes*60,
                { seconds: 'disabled',
                    hours: 'enabled' }
            );
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
