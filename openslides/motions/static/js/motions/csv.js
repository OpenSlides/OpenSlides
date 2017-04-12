(function () {

'use strict';

angular.module('OpenSlidesApp.motions.csv', [])

.factory('MotionCsvExport', [
    'gettextCatalog',
    'Config',
    'CsvDownload',
    'lineNumberingService',
    function (gettextCatalog, Config, CsvDownload, lineNumberingService) {
        var makeHeaderline = function () {
            var headerline = ['Identifier', 'Title', 'Text', 'Reason', 'Submitter', 'Category', 'Origin'];
            return _.map(headerline, function (entry) {
                return gettextCatalog.getString(entry);
            });
        };
        return {
            export: function (motions, params) {
                if (!params) {
                    params = {};
                }
                _.defaults(params, {
                    filename: 'motions-export.csv',
                    changeRecommendationMode: Config.get('motions_recommendation_text_mode').value,
                    includeReason: true,
                });
                if (!_.includes(['original', 'changed', 'agreed'], params.changeRecommendationMode)) {
                    params.changeRecommendationMode = 'original';
                }

                var csvRows = [
                    makeHeaderline()
                ];
                _.forEach(motions, function (motion) {
                    var text = motion.getTextByMode(params.changeRecommendationMode, null, null, false);
                    var row = [];
                    row.push('"' + motion.identifier !== null ? motion.identifier : '' + '"');
                    row.push('"' + motion.getTitle() + '"');
                    row.push('"' + text + '"');
                    if (params.includeReason) {
                        row.push('"' + motion.getReason() + '"');
                    } else {
                        row.push('""');
                    }
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
