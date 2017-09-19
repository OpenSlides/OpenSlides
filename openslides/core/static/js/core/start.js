(function () {

'use strict';

angular.module('OpenSlidesApp.core.start', [])

.factory('OpenSlides', [
    '$http',
    '$rootScope',
    '$state',
    '$q',
    'DS',
    'autoupdate',
    'operator',
    'Group',
    'mainMenu',
    'ngDialog',
    'LoginDialog',
    function($http, $rootScope, $state, $q, DS, autoupdate, operator, Group, mainMenu, ngDialog, LoginDialog) {
        var OpenSlides = {
            bootup: function () {
                $rootScope.openslidesBootstrapDone = false;
                $http.get('/users/whoami/').then(function (success) {
                    $rootScope.guest_enabled = success.data.guest_enabled;
                    if (success.data.user_id === null && !success.data.guest_enabled) {
                        // Redirect to login dialog if user is not logged in.
                        $state.go('login', {guest_enabled: success.data.guest_enabled});
                    } else {
                        autoupdate.newConnect();
                        autoupdate.firstMessageDeferred.promise.then(function () {
                            operator.setUser(success.data.user_id, success.data.user);
                            $rootScope.operator = operator;
                            mainMenu.updateMainMenu();
                            $rootScope.openslidesBootstrapDone = true;
                        });
                    }
                });
            },
            shutdown: function () {
                // Close connection, clear the store and show the OS overlay.
                autoupdate.closeConnection();
                DS.clear();
                operator.setUser(null);
                $rootScope.openslidesBootstrapDone = false;
                $rootScope.operator = operator;
                // close all open dialogs (except the login dialog)
                _.forEach(ngDialog.getOpenDialogs(), function (id) {
                    if (id !== LoginDialog.id) {
                        ngDialog.close(id);
                    }
                });
            },
            reboot: function () {
                this.shutdown();
                this.bootup();
            },
        };

        // We need to 'ping' the server with a get request to whoami, because then we can decide,
        // if the server is down or respond with a 403 (this cannot be differentiated with websockets)
        autoupdate.registerRetryConnectCallback(function () {
            return $http.get('/users/whoami').then(function (success) {
                if (success.data.user_id === null && !success.data.guest_enabled) {
                    OpenSlides.shutdown();
                    // Redirect to login dialog if user is not logged in.
                    $state.go('login', {guest_enabled: success.data.guest_enabled});
                } else {
                    autoupdate.newConnect();
                }
            });
        });

        return OpenSlides;
    }
])

.run([
    'OpenSlides',
    function (OpenSlides) {
        OpenSlides.bootup();
    }
])

.run([
    '$rootScope',
    '$state',
    'operator',
    'User',
    'Group',
    'mainMenu',
    function ($rootScope, $state, operator, User, Group, mainMenu) {
        var permissionChangeCallback = function () {
            operator.reloadPerms();
            mainMenu.updateMainMenu();
            var stateData = $state.current.data;
            var basePerm = stateData ? stateData.basePerm : '';
            $rootScope.baseViewPermissionsGranted = basePerm ?
                operator.hasPerms(basePerm) : true;
        };

        $rootScope.$watch(function () {
            return Group.lastModified();
        }, function () {
            if (Group.getAll().length) {
                permissionChangeCallback();
            }
        });

        $rootScope.$watch(function () {
            return operator.user ? User.lastModified(operator.user.id) : true;
        }, function () {
            permissionChangeCallback();
        });
    }
]);

}());
