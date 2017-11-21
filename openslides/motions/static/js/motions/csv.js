(function () {

'use strict';

angular.module('OpenSlidesApp.motions.csv', [])

.factory('MotionCsvExport', [
    'gettextCatalog',
    'Config',
    'CsvDownload',
    'lineNumberingService',
    function (gettextCatalog, Config, CsvDownload, lineNumberingService) {
        var makeHeaderline = function (params) {
            var headerline = ['Identifier', 'Title'];
            if (params.include.text) {
                headerline.push('Text');
            }
            if (params.include.reason) {
                headerline.push('Reason');
            }
            if (params.include.submitters) {
                headerline.push('Submitter');
            }
            headerline.push('Category');
            if (params.include.origin) {
                headerline.push('Origin');
            }
            if (params.include.motionBlock) {
                headerline.push('Motion block');
            }
            if (params.include.state) {
                headerline.push('State');
            }
            if (params.include.recommendation) {
                headerline.push('Recommendation');
            }
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
                    include: {
                        text: true,
                        reason: true,
                        submitters: true,
                        origin: true,
                        motionBlock: true,
                        state: true,
                        recommendation: true,
                    },
                });
                if (!_.includes(['original', 'changed', 'agreed'], params.changeRecommendationMode)) {
                    params.changeRecommendationMode = 'original';
                }

                var csvRows = [
                    makeHeaderline(params)
                ];
                _.forEach(motions, function (motion) {
                    var text = motion.getTextByMode(params.changeRecommendationMode, null, null, false);
                    var row = [];
                    // Identifier and title
                    row.push('"' + motion.identifier !== null ? motion.identifier : '' + '"');
                    row.push('"' + motion.getTitle() + '"');

                    // Text
                    if (params.include.text) {
                        row.push('"' + text + '"');
                    }

                    // Reason
                    if (params.include.reason) {
                        row.push('"' + motion.getReason() + '"');
                    }

                    // Submitters
                    if (params.include.submitters) {
                        var submitters = motion.submitters[0] ? motion.submitters[0].get_full_name() : '';
                        row.push('"' + submitters + '"');
                    }

                    // Category
                    var category = motion.category ? motion.category.name : '';
                    row.push('"' + category + '"');

                    // Origin
                    if (params.include.origin) {
                        row.push('"' + motion.origin + '"');
                    }

                    // Motion block
                    if (params.include.motionBlock) {
                        var blockTitle = motion.motionBlock ? motion.motionBlock.title : '';
                        row.push('"' + blockTitle + '"');
                    }

                    // State
                    if (params.include.state) {
                        row.push('"' + motion.getStateName() + '"');
                    }

                    // Recommendation
                    if (params.include.recommendation) {
                        row.push('"' + motion.getRecommendationName() + '"');
                    }

                    csvRows.push(row);
                });
                CsvDownload(csvRows, 'motions-export.csv');
            },
            downloadExample: function () {
                var csvRows = [makeHeaderline({ include: {
                        text: true,
                        reason: true,
                        submitters: true,
                        origin: true,
                        motionBlock: true,
                        state: true,
                        recommendation: true,
                    }}),
                    // example entries
                    ['A1', 'Title 1', 'Text 1', 'Reason 1', 'Submitter A', 'Category A', 'Last Year Conference A', 'Block A', 'permitted', ''],
                    ['B1', 'Title 2', 'Text 2', 'Reason 2', 'Submitter B', 'Category B', '', 'Block A', 'accepted', 'Acceptance'],
                    [''  , 'Title 3', 'Text 3', '', '', '', '', '', '', ''],
                ];
                CsvDownload(csvRows, 'motions-example.csv');
            },
        };
    }
]);

}());
