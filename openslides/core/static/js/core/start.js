(function () {

'use strict';

angular.module('OpenSlidesApp.core.start', [])

.run([
    '$http',
    '$rootScope',
    '$state',
    'autoupdate',
    'operator',
    function($http, $rootScope, $state, autoupdate, operator) {
        // Put the operator into the root scope
        $http.get('/users/whoami/').success(function(data) {
            $rootScope.guest_enabled = data.guest_enabled;
            if (data.user_id === null && !data.guest_enabled) {
                // Redirect to login dialog if user is not logged in.
                $state.go('login', {guest_enabled: data.guest_enabled});
            } else {
                autoupdate.newConnect();
                // TODO: Connect websocket
                // Then operator.setUser(data.user_id, data.user); $rootScope.operator = operator;
            }
        });
    }
])

.factory('operator', [
    'Group',
    'User',
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
                    operator.perms = operator.user.getPerms();
                } else {
                    operator.user = null;
                    operator.perms = Group.get(1).permissions;
                }
            },
            // Returns true if the operator has at least one perm of the perms-list.
            hasPerms: function(perms) {
                if (typeof perms === 'string') {
                    perms = perms.split(' ');
                }
                return _.intersection(perms, operator.perms).length > 0;
            },
            // Returns true if the operator is a member of group.
            isInGroup: function(group) {
                return _.indexOf(operator.user.groups_id, group.id) > -1;
            },
        };
        return operator;
    }
])

}());
