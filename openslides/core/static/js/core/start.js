(function () {

'use strict';

angular.module('OpenSlidesApp.core.start', [])

.run([
    '$http',
    '$rootScope',
    '$state',
    'autoupdate',
    'operator',
    'Group',
    'mainMenu',
    function($http, $rootScope, $state, autoupdate, operator, Group, mainMenu) {
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
