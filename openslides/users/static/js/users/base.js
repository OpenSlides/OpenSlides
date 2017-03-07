(function () {

'use strict';

angular.module('OpenSlidesApp.users', [])

.factory('User', [
    'DS',
    'Group',
    'jsDataModel',
    'gettext',
    'gettextCatalog',
    'Config',
    function(DS, Group, jsDataModel, gettext, gettextCatalog, Config) {
        var name = 'users/user';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Participants'),
            verboseNamePlural: gettext('Participants'),
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
                /*
                 * Returns a short form of the name.
                 *
                 * Example:
                 * - Dr. Max Mustermann
                 * - Professor Dr. Enders, Christoph
                 */
                get_short_name: function() {
                    var title = _.trim(this.title),
                        firstName = _.trim(this.first_name),
                        lastName = _.trim(this.last_name),
                        name = '';
                    if (Config.get('users_sort_by') && Config.get('users_sort_by').value == 'last_name') {
                        if (lastName && firstName) {
                            name += [lastName, firstName].join(', ');
                        } else {
                            name += lastName || firstName;
                        }
                    } else {
                        name += [firstName, lastName].join(' ');
                    }
                    if (title !== '') {
                        name = title + ' ' + name;
                    }
                    return name.trim();
                },
                /*
                 * Returns a long form of the name.
                 *
                 * Example:
                 * - Dr. Max Mustermann (Villingen)
                 * - Professor Dr. Enders, Christoph (Leipzig)
                 */
                get_full_name: function() {
                    var name = this.get_short_name(),
                        structure_level = _.trim(this.structure_level),
                        number = _.trim(this.number),
                        addition = [];

                    // addition: add number and structure level
                    if (structure_level) {
                        addition.push(structure_level);
                    }
                    if (number) {
                        addition.push(
                            /// abbreviation for number
                            gettextCatalog.getString('No.') + ' ' + number
                        );
                    }
                    if (addition.length > 0) {
                        name += ' (' + addition.join(' · ') + ')';
                    }
                    return name.trim();
                },
                getPerms: function() {
                    var allPerms = [];
                    var allGroups = [];
                    if (this.groups_id) {
                        allGroups = this.groups_id.slice(0);
                    }
                    if (allGroups.length === 0) {
                        allGroups.push(1); // add default group
                    }
                    _.forEach(allGroups, function(groupId) {
                        var group = Group.get(groupId);
                        if (group) {
                            _.forEach(group.permissions, function(perm) {
                                allPerms.push(perm);
                            });
                        }
                    });
                    return _.uniq(allPerms);
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.get_full_name();
                },
                // subtitle of search result
                getSearchResultSubtitle: function () {
                    return "Participant";
                },
            },
            relations: {
                hasMany: {
                    'users/group': {
                        localField: 'groups',
                        localKey: 'groups_id',
                    }
                }
            }
        });
    }
])

.factory('Group', [
    '$http',
    'DS',
    function($http, DS) {
        var permissions;
        return DS.defineResource({
            name: 'users/group',
            permissions: permissions,
            // TODO (Issue 2862): Do not query the permissions from server. They should be included
            // in the startup data. Then remove 'permission' injection from group list controller.
            getPermissions: function() {
                if (!this.permissions) {
                    this.permissions = $http({ 'method': 'OPTIONS', 'url': '/rest/users/group/' })
                        .then(function(result) {
                            return result.data.actions.POST.permissions.choices;
                        });
                }
                return this.permissions;
            }
        });
    }
])

.run([
    'User',
    'Group',
    function(User, Group) {}
])


// Mark strings for translation in JavaScript.
.config([
    'gettext',
    function (gettext) {
        // default group names (from users/signals.py)
        gettext('Default');
        gettext('Delegates');
        gettext('Staff');
        gettext('Committees');
    }
]);

}());
