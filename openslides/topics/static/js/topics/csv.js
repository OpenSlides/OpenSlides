(function () {

'use strict';

angular.module('OpenSlidesApp.topics.csv', [])

.factory('TopicsCsvExample', [
    'gettextCatalog',
    'CsvDownload',
    function (gettextCatalog, CsvDownload) {
        var makeHeaderline = function () {
            var headerline = ['Title', 'Text', 'Duration', 'Comment', 'Internal item'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            downloadExample: function () {
                var csvRows = [makeHeaderline(),
                    // example entries
                    ['Demo 1', 'Demo text 1', '1:00', 'test comment', ''],
                    ['Break', '', '0:10', '', '1'],
                    ['Demo 2', 'Demo text 2', '1:30', '', '']

                ];
                CsvDownload(csvRows, 'agenda-example.csv');
            },
        };
    }
]);

}());
