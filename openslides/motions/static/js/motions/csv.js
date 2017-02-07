(function () {

'use strict';

angular.module('OpenSlidesApp.motions.csv', [])

.factory('MotionCsvExport', [
    'gettextCatalog',
    'CsvDownload',
    function (gettextCatalog, CsvDownload) {
        var makeHeaderline = function () {
            var headerline = ['Identifier', 'Title', 'Text', 'Reason', 'Submitter', 'Category', 'Origin'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            export: function (motions) {
                var csvRows = [
                    makeHeaderline()
                ];
                _.forEach(motions, function (motion) {
                    var row = [];
                    row.push('"' + motion.identifier !== null ? motion.identifier : '' + '"');
                    row.push('"' + motion.getTitle() + '"');
                    row.push('"' + motion.getText() + '"');
                    row.push('"' + motion.getReason() + '"');
                    var submitter = motion.submitters[0] ? motion.submitters[0].get_full_name() : '';
                    row.push('"' + submitter + '"');
                    var category = motion.category ? motion.category.name : '';
                    row.push('"' + category + '"');
                    row.push('"' + motion.origin + '"');
                    csvRows.push(row);
                });
                CsvDownload(csvRows, 'motions-export.csv');
            },
            downloadExample: function () {
                var csvRows = [makeHeaderline(),
                    // example entries
                    ['A1', 'Title 1', 'Text 1', 'Reason 1', 'Submitter A', 'Category A', 'Last Year Conference A'],
                    ['B1', 'Title 2', 'Text 2', 'Reason 2', 'Submitter B', 'Category B', ''],
                    [''  , 'Title 3', 'Text 3', '', '', '', ''],
                ];
                CsvDownload(csvRows, 'motions-example.csv');
            },
        };
    }
]);

}());
