(function () {

'use strict';

angular.module('OpenSlidesApp.motions.docx', ['OpenSlidesApp.core.docx'])

.factory('MotionDocxExport', [
    '$http',
    '$q',
    'operator',
    'Config',
    'Category',
    'gettextCatalog',
    'FileSaver',
    'lineNumberingService',
    'Html2DocxConverter',
    'MotionComment',
    function ($http, $q, operator, Config, Category, gettextCatalog, FileSaver, lineNumberingService,
        Html2DocxConverter, MotionComment) {

        var PAGEBREAK = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';

        var converter;

        var getData = function (motions, params) {
            var data = {};
            // header
            var headerline1 = [
                Config.translate(Config.get('general_event_name').value),
                Config.translate(Config.get('general_event_description').value)
            ].filter(Boolean).join(' – ');
            var headerline2 = [
                Config.get('general_event_location').value,
                Config.get('general_event_date').value
            ].filter(Boolean).join(', ');
            data.header = [headerline1, headerline2].join('\n');

            // motion catalog title/preamble
            data.title = Config.translate(Config.get('motions_export_title').value);
            data.preamble = Config.get('motions_export_preamble').value;

            // categories
            var categories = getCategoriesData(motions);
            data.has_categories = categories.length === 0 ? false : true;
            data.categories_translation = gettextCatalog.getString('Categories');
            data.categories = categories;
            data.no_categories = gettextCatalog.getString('No categories available.');
            data.pagebreak_main = categories.length === 0 ? '' : PAGEBREAK;

            // motions
            data.tableofcontents_translation = gettextCatalog.getString('Table of contents');
            data.motions_list = getMotionShortData(motions, params);
            data.no_motions = gettextCatalog.getString('No motions available.');

            return $q(function (resolve) {
                getMotionFullData(motions, params).then(function (motionData) {
                    data.motions = motionData;
                    resolve(data);
                });
            });
        };

        var getCategoriesData = function (motions) {
            var categories = _.map(motions, function (motion) {
                if (motion.category) {
                    return {
                        prefix: motion.category.prefix,
                        name: motion.category.name,
                    };
                }
            });
            // clear out 'undefined' and make the categories unique.
            categories = _.uniqBy(_.filter(categories, function(category) {
                return category;
            }), 'prefix');
            var sortKey = Config.get('motions_export_category_sorting').value;
            return _.orderBy(categories, [sortKey]);
        };

        var getMotionShortData = function (motions, params) {
            return _.map(motions, function (motion) {
                return {
                    identifier: motion.identifier || '',
                    title: motion.getTitleWithChanges(params.changeRecommendationMode),
                };
            });
        };

        var getMotionFullData = function (motions, params) {
            // All translations
            var translation = gettextCatalog.getString('Motion'),
                sequential_translation = gettextCatalog.getString('Sequential number'),
                submitters_translation = gettextCatalog.getString('Submitters'),
                status_translation = gettextCatalog.getString('Status'),
                reason_translation = gettextCatalog.getString('Reason'),
                comment_translation = gettextCatalog.getString('Comments');
            var sequential_enabled = Config.get('motions_export_sequential_number').value;
            // promises for create the actual motion data
            var promises = _.map(motions, function (motion) {
                var title = motion.getTitleWithChanges(params.changeRecommendationMode);
                var text = params.include.text ? motion.getTextByMode(params.changeRecommendationMode, null, null, false) : '';
                var reason = params.include.reason ? motion.getReason() : '';
                var comments = getMotionComments(motion, params.includeComments);

                // Data for one motions. Must include translations, ...
                var motionData = {
                    // Translations
                    motion_translation: translation,
                    sequential_translation: sequential_translation,
                    submitters_translation: submitters_translation,
                    reason_translation: reason.length === 0 ? '' : reason_translation,
                    status_translation: status_translation,
                    comment_translation: comments.length === 0 ? '' : comment_translation,
                    sequential_enabled: sequential_enabled,
                    // Actual data
                    id: motion.id,
                    identifier: motion.identifier || '',
                    title: title,
                    submitters: params.include.submitters ?  _.map(motion.submitters, function (submitter) {
                                    return submitter.get_full_name();
                                }).join(', ') : '',
                    status: motion.getStateName(),
                    // Miscellaneous stuff
                    preamble: gettextCatalog.getString(Config.get('motions_preamble').value),
                    pagebreak: PAGEBREAK,
                };
                // converting html to docx is async, so text, reason and comments are inserted here.
                return $q(function (resolve) {
                    var convertPromises = _.map(comments, function (comment) {
                        return converter.html2docx(comment.comment).then(function (commentAsDocx) {
                            comment.comment = commentAsDocx;
                        });
                    });
                    convertPromises.push(converter.html2docx(text).then(function (textAsDocx) {
                        motionData.text = textAsDocx;
                    }));
                    convertPromises.push(converter.html2docx(reason).then(function (reasonAsDocx) {
                        motionData.reason = reasonAsDocx;
                    }));
                    $q.all(convertPromises).then(function () {
                        motionData.comments = comments;
                        resolve(motionData);
                    });
                });
            });
            // resolve, if all motion data is fetched.
            return $q(function (resolve) {
                $q.all(promises).then(function (data) {
                    if (data.length) {
                        // clear pagebreak on last element
                        data[data.length - 1].pagebreak = '';
                    }
                    resolve(data);
                });
            });
        };

        var getMotionComments = function (motion, fieldsIncluded) {
            var fields = MotionComment.getNoSpecialCommentsFields();
            var comments = [];
            _.forEach(fieldsIncluded, function (ok, id) {
                if (ok && motion.comments[id]) {
                    var title = fields[id].name;
                    if (!fields[id].public) {
                        title += ' (' + gettextCatalog.getString('internal') + ')';
                    }
                    var comment = motion.comments[id];
                    if (comment.indexOf('<p>') !== 0) {
                        comment = '<p>' + comment + '</p>';
                    }
                    comments.push({
                        title: title,
                        comment: comment,
                    });
                }
            });
            return comments;
        };

        return {
            export: function (motions, params) {
                converter = Html2DocxConverter.createInstance();
                params = _.clone(params || {}); // Clone this to avoid sideeffects.
                _.defaults(params, {
                    filename: gettextCatalog.getString('motions') + '.docx',
                    changeRecommendationMode: Config.get('motions_recommendation_text_mode').value,
                    include: {
                        text: true,
                        reason: true,
                        submitters: true,
                    },
                    includeComments: {},
                });
                if (!_.includes(['original', 'changed', 'agreed'], params.changeRecommendationMode)) {
                    params.changeRecommendationMode = 'original';
                }

                $http.get('/motions/docxtemplate/').then(function (success) {
                    var content = window.atob(success.data);
                    var doc = new Docxgen(content);

                    getData(motions, params).then(function (data) {
                        doc.setData(data);
                        doc.render();

                        var zip = doc.getZip();
                        zip = converter.updateZipFile(zip);

                        var out = zip.generate({type: 'blob'});
                        FileSaver.saveAs(out, params.filename);
                    });
                });
            },
        };
    }
]);

}());
