(function () {

'use strict';

angular.module('OpenSlidesApp.users.csv', [])

.factory('UserCsvExport', [
    'Group',
    'gettextCatalog',
    'CsvDownload',
    function (Group, gettextCatalog, CsvDownload) {
        var makeHeaderline = function () {
            var headerline = ['Title', 'Given name', 'Surname', 'Structure level', 'Participant number', 'Groups',
                'Comment', 'Is active', 'Is present', 'Is a committee'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            export: function (users) {
                var csvRows = [
                    makeHeaderline()
                ];
                _.forEach(users, function (user) {
                    var groups = _.map(user.groups_id, function (id) {
                        return gettextCatalog.getString(Group.get(id).name);
                    }).join(',');
                    var row = [];
                    row.push('"' + user.title + '"');
                    row.push('"' + user.first_name + '"');
                    row.push('"' + user.last_name + '"');
                    row.push('"' + user.structure_level + '"');
                    row.push('"' + user.number + '"');
                    row.push('"' + groups + '"');
                    row.push('"' + user.comment + '"');
                    row.push(user.is_active ? '1' : '0');
                    row.push(user.is_present ? '1' : '0');
                    row.push(user.is_committee ? '1' : '0');
                    csvRows.push(row);
                });
                CsvDownload(csvRows, 'users-export.csv');
            },

            downloadExample: function () {
                // try to get an example with two groups and one with one group
                var groups = Group.getAll();
                var csvGroups = '';
                var csvGroup = '';
                if (groups.length >= 3) { // do not pick groups[0], this is the default group
                    csvGroups = '"' + gettextCatalog.getString(groups[1].name) +
                                ', ' + gettextCatalog.getString(groups[2].name) + '"';
                }
                if (groups.length >= 2) {
                    csvGroup = gettextCatalog.getString(groups[groups.length - 1].name); // take last group
                }

                var csvRows = [makeHeaderline(),
                    // example entries
                    ['Dr.', 'Max', 'Mustermann', 'Berlin','1234567890', csvGroups, 'xyz', '1', '1', ''],
                    ['', 'John', 'Doe', 'Washington','75/99/8-2', csvGroup, 'abc', '1', '1', ''],
                    ['', 'Fred', 'Bloggs', 'London', '', '', '', '', '', ''],
                    ['', '', 'Executive Board', '', '', '', '', '', '', '1'],

                ];
                CsvDownload(csvRows, 'users-example.csv');
            }
        };
    }
]);

}());
