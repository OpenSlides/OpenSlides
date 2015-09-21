(function () {

'use strict';

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
            };

            this.socket.onclose = function() {
                setTimeout(autoupdate.connect, 5000);
            };
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

            // Loads all chat messages data
            ChatMessage.findAll();

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

.factory('Customslide', [
    'DS',
    'jsDataModel',
    function(DS, jsDataModel) {
        var name = 'core/customslide';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            methods: {
                getResourceName: function () {
                    return name;
                },
                getAgendaTitle: function () {
                    return this.title;
                }
            },
            relations: {
                belongsTo: {
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                }
            }
        });
    }
])

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

.factory('ChatMessage', ['DS', function(DS) {
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

/* Options for CKEditor used in various create and edit views. */
.value('CKEditorOptions', {
    allowedContent:
        'h1 h2 h3 p pre b i u strike strong em blockquote;' +
        'a[!href];' +
        'img[!src,alt]{width,height,float};' +
        'table tr th td caption;' +
        'li ol ul{list-style};' +
        'span{color,background-color};',
    extraPlugins: 'colorbutton',
    toolbarGroups: [
        { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
        { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
        { name: 'forms', groups: [ 'forms' ] },
        { name: 'tools', groups: [ 'tools' ] },
        { name: 'about', groups: [ 'about' ] },
        { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
        { name: 'others', groups: [ 'others' ] },
        '/',
        { name: 'styles', groups: [ 'styles' ] },
        { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
        { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
        { name: 'links', groups: [ 'links' ] },
        { name: 'insert', groups: [ 'insert' ] },
        { name: 'colors', groups: [ 'colors' ] }
    ],
    removeButtons: 'Anchor,SpecialChar,Subscript,Superscript,Styles,RemoveFormat,HorizontalRule'
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
