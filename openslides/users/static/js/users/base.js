(function () {

'use strict';

angular.module('OpenSlidesApp.users', [])

.factory('User', ['DS', 'Group', 'jsDataModel', function(DS, Group, jsDataModel) {
    var name = 'users/user';
    return DS.defineResource({
        name: name,
        useClass: jsDataModel,
        computed: {
            full_name: function () {
                return this.get_full_name();
            },
            short_name: function () {
                return this.get_short_name();
            },
        },
        methods: {
            getResourceName: function () {
                return name;
            },
            get_short_name: function() {
                // should be the same as in the python user model.
                var firstName = _.trim(this.first_name),
                    lastName = _.trim(this.last_name),
                    name;

                if (firstName && lastName) {
                    // TODO: check config
                    name = [firstName, lastName].join(' ');
                } else {
                    name = firstName || lastName || this.username;
                }
                return name;
            },
            get_full_name: function() {
                // should be the same as in the python user model.
                var firstName = _.trim(this.first_name),
                    lastName = _.trim(this.last_name),
                    structure_level = _.trim(this.structure_level),
                    name;

                if (firstName && lastName) {
                    // TODO: check config
                    name = [firstName, lastName].join(' ');
                } else {
                    name = firstName || lastName || this.username;
                }
                if (structure_level) {
                    name = name + " (" + structure_level + ")";
                }
                return name;
            },
            getPerms: function() {
                var allPerms = [];
                var allGroups = this.groups;
                // Add registered group
                allGroups.push(2);
                _.forEach(allGroups, function(groupId) {
                    // Get group from server
                    Group.find(groupId);
                    // But do not work with the returned promise, because in
                    // this case this method can not be called in $watch
                    var group = Group.get(groupId);
                    if (group) {
                        _.forEach(group.permissions, function(perm) {
                            allPerms.push(perm);
                        });
                    }
                });
                return _.uniq(allPerms);
            },
        },
    });
}])

.factory('Group', ['DS', function(DS) {
    return DS.defineResource({
        name: 'users/group',
    });
}])

.run(['User', 'Group', function(User, Group) {}]);

}());
