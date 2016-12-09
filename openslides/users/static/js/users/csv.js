(function () {

'use strict';

angular.module('OpenSlidesApp.users.csv', [])

.factory('UserCsvExport', [
    function () {
        return function (element, users) {
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
        };
    }
]);

}());
