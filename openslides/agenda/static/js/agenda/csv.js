(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.csv', [])

.factory('AgendaCsvExport', [
    'HumanTimeConverter',
    function (HumanTimeConverter) {
        return function (element, agenda) {
            var csvRows = [
                ['title', 'text', 'duration', 'comment', 'is_hidden'],
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
        };
    }
]);

}());
