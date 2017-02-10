(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.csv', [])

.factory('AgendaCsvExport', [
    'HumanTimeConverter',
    'gettextCatalog',
    'CsvDownload',
    function (HumanTimeConverter, gettextCatalog, CsvDownload) {
        var makeHeaderline = function () {
            var headerline = ['Title', 'Text', 'Duration', 'Comment', 'Internal item'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            export: function (agenda) {
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
                CsvDownload(csvRows, 'agenda-export.csv');
            },
        };
    }
]);

}());
