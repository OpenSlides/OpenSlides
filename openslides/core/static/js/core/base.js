(function () {

'use strict';

// The core module used for the OpenSlides site and the projector
angular.module('OpenSlidesApp.core', [
    'js-data',
    'gettext',
    'ngAnimate',
    'ngSanitize',  // TODO: only use this in functions that need it.
    'ui.bootstrap',
    'ui.tree',
    'pdf'
])

.config([
    'DSProvider',
    'DSHttpAdapterProvider',
    function(DSProvider, DSHttpAdapterProvider) {
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
    }
])

.factory('autoupdate', [
    'DS',
    '$rootScope',
    function (DS, $rootScope) {
        var socket = null;
        var recInterval = null;
        $rootScope.connected = false;

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
            socket = new WebSocket('ws://' + location.host + '/ws/');
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
    function (gettext, gettextCatalog) {
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
                angular.forEach(languages, function (language) {
                    language.selected = false;
                    if (language.code == lang) {
                        language.selected = true;
                        gettextCatalog.setCurrentLanguage(lang);
                        if (lang != 'en') {
                            gettextCatalog.loadRemote("static/i18n/" + lang + ".json");
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

            var data = JSON.parse(json);
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
            // If you want to handle more status codes, change server
            // restrictions in utils/autoupdate.py.
        });
    }
])

.factory('loadGlobalData', [
    '$rootScope',
    '$http',
    'ChatMessage',
    'Config',
    'Projector',
    function ($rootScope, $http, ChatMessage, Config, Projector) {
        return function () {
            // Puts the config object into each scope.
            Config.findAll().then(function() {
                $rootScope.config = function(key) {
                    try {
                        return Config.get(key).value;
                    }
                    catch(err) {
                        console.log("Unkown config key: " + key);
                        return '';
                    }
                };
            });

            // Loads all projector data
            Projector.findAll();

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

            // Loads server time and calculates server offset
            $http.get('/core/servertime/').then(function(data) {
                $rootScope.serverOffset = Math.floor( Date.now() / 1000 - data.data );
            });
        };
    }
])

// Load the global data on startup
.run([
    'loadGlobalData',
    function(loadGlobalData) {
        loadGlobalData();
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
                var html = hooks.map(function (hook) {
                    return '<div>' + hook.template + '</div>';
                }).join('');
                iElement.append($compile(html)(scope));
            }
        };
    }
])

.factory('jsDataModel', [
    '$http',
    'Projector',
    function($http, Projector) {
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
            var isProjected;
            if (typeof projector !== 'undefined') {
                var self = this;
                var predicate = function (element) {
                    return element.name == self.getResourceName() &&
                        typeof element.id !== 'undefined' &&
                        element.id == self.id;
                };
                isProjected = typeof _.findKey(projector.elements, predicate) === 'string';
            } else {
                isProjected = false;
            }
            return isProjected;
        };
        return BaseModel;
    }
])

.factory('Customslide', [
    'DS',
    'jsDataModel',
    'gettext',
    function(DS, jsDataModel, gettext) {
        var name = 'core/customslide';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Agenda item'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                getAgendaTitle: function () {
                    return this.title;
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.getAgendaTitle();
                },
                // subtitle of search result
                getSearchResultSubtitle: function () {
                    return "Agenda item";
                },
            },
            relations: {
                belongsTo: {
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'mediafiles/mediafile': {
                        localField: 'attachments',
                        localKeys: 'attachments_id',
                    }
                }
            }
        });
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
    function(DS) {
        return DS.defineResource({
            name: 'core/projector',
            onConflict: 'replace',
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

.filter('osFilter', [
    '$filter',
    function ($filter) {
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
    'Customslide',
    'Projector',
    'Tag',
    function (ChatMessage, Config, Customslide, Projector, Tag) {}
]);

}());
