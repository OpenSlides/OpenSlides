(function () {

'use strict';

angular.module('OpenSlidesApp.users.csv', [])

.factory('UserCsvExport', [
    'Group',
    'gettextCatalog',
    function (Group, gettextCatalog) {
        return {
            export: function (element, users) {
                var csvRows = [
                    ['title', 'first_name', 'last_name', 'structure_level', 'number', 'groups', 'comment', 'is_active', 'is_present', 'is_committee'],
                ];
                _.forEach(users, function (user) {
                    var row = [];
                    row.push('"' + user.title + '"');
                    row.push('"' + user.first_name + '"');
                    row.push('"' + user.last_name + '"');
                    row.push('"' + user.structure_level + '"');
                    row.push('"' + user.number + '"');
                    row.push('"' + user.groups_id.join(',') + '"');
                    row.push('"' + user.comment + '"');
                    row.push(user.is_active ? '1' : '0');
                    row.push(user.is_present ? '1' : '0');
                    row.push(user.is_committee ? '1' : '0');
                    csvRows.push(row);
                });

                var csvString = csvRows.join("%0A");
                element.href = 'data:text/csv;charset=utf-8,' + csvString;
                element.download = 'users-export.csv';
                element.target = '_blank';
            },

            downloadExample: function (element) {
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
                var csvRows = [
                    // column header line
                    ['title', 'first_name', 'last_name', 'structure_level', 'number', 'groups', 'comment', 'is_active', 'is_present', 'is_committee'],
                    // example entries
                    ['Dr.', 'Max', 'Mustermann', 'Berlin','1234567890', csvGroups, 'xyz', '1', '1', ''],
                    ['', 'John', 'Doe', 'Washington','75/99/8-2', csvGroup, 'abc', '1', '1', ''],
                    ['', 'Fred', 'Bloggs', 'London', '', '', '', '', '', ''],
                    ['', '', 'Executive Board', '', '', '', '', '', '', '1'],

                ];
                var csvString = csvRows.join("%0A");
                element.href = 'data:text/csv;charset=utf-8,' + csvString;
                element.download = 'users-example.csv';
                element.target = '_blank';
            }
        };
    }
]);

}());
