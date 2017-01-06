(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.csv', [])

.factory('AgendaCsvExport', [
    'HumanTimeConverter',
    'gettextCatalog',
    function (HumanTimeConverter, gettextCatalog) {
        var makeHeaderline = function () {
            var headerline = ['Title', 'Text', 'Duration', 'Comment', 'Internal item'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            export: function (element, agenda) {
                var csvRows = [
                    makeHeaderline()
                ];
                _.forEach(agenda, function (item) {
                    var row = [];
                    var duration = item.duration ? HumanTimeConverter.secondsToHumanTime(item.duration*60,
                            { seconds: 'disabled',
                                hours: 'enabled' }) : '';
                    row.push('"' + (item.title || '') + '"');
                    row.push('"' + (item.text || '') + '"');
                    row.push('"' + duration + '"');
                    row.push('"' + (item.comment || '') + '"');
                    row.push('"' + (item.is_hidden ? '1' : '')  + '"');
                    csvRows.push(row);
                });

                var csvString = csvRows.join("%0A");
                element.href = 'data:text/csv;charset=utf-8,' + csvString;
                element.download = 'agenda-export.csv';
                element.target = '_blank';
            },
        };
    }
]);

}());
