(function () {

'use strict';

angular.module('OpenSlidesApp.topics.csv', [])

.factory('TopicsCsvExample', [
    'gettextCatalog',
    function (gettextCatalog) {
        var makeHeaderline = function () {
            var headerline = ['Title', 'Text', 'Duration', 'Comment', 'Internal item'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            downloadExample: function (element) {
                var csvRows = [makeHeaderline(),
                    // example entries
                    ['Demo 1', 'Demo text 1', '1:00', 'test comment', ''],
                    ['Break', '', '0:10', '', '1'],
                    ['Demo 2', 'Demo text 2', '1:30', '', '']

                ];
                var csvString = csvRows.join("%0A");
                element.href = 'data:text/csv;charset=utf-8,' + csvString;
                element.download = 'agenda-example.csv';
                element.target = '_blank';

            },
        };
    }
]);

}());
