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
    function ($http, $q, operator, Config, Category, gettextCatalog, FileSaver, lineNumberingService, Html2DocxConverter) {

        var PAGEBREAK = '<w:p><w:r><w:br w:type="page" /></w:r></w:p>';

        var converter;

        var getData = function (motions, params) {
            var data = {};
            var categories = Category.getAll();
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
            data.has_categories = categories.length === 0 ? false : true;
            data.categories_translation = gettextCatalog.getString('Categories');
            data.categories = getCategoriesData(categories);
            data.no_categories = gettextCatalog.getString('No categories available.');
            data.pagebreak_main = categories.length === 0 ? '' : PAGEBREAK;

            // motions
            data.tableofcontents_translation = gettextCatalog.getString('Table of contents');
            data.motions_list = getMotionShortData(motions);
            data.no_motions = gettextCatalog.getString('No motions available.');

            return $q(function (resolve) {
                getMotionFullData(motions, params).then(function (motionData) {
                    data.motions = motionData;
                    resolve(data);
                });
            });
        };

        var getCategoriesData = function (categories) {
            return _.map(categories, function (category) {
                return {
                    prefix: category.prefix,
                    name: category.name,
                };
            });
        };

        var getMotionShortData = function (motions) {
            return _.map(motions, function (motion) {
                return {
                    identifier: motion.identifier,
                    title: motion.getTitle(),
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
            // promises for create the actual motion data
            var promises = _.map(motions, function (motion) {
                var text = motion.getTextByMode(params.changeRecommendationMode, null, null, false);
                var reason = params.includeReason ? motion.getReason() : '';
                var comments = params.includeComments ? getMotionComments(motion) : [];

                // Data for one motions. Must include translations, ...
                var motionData = {
                    // Translations
                    motion_translation: translation,
                    sequential_translation: sequential_translation,
                    submitters_translation: submitters_translation,
                    reason_translation: reason.length === 0 ? '' : reason_translation,
                    status_translation: status_translation,
                    comment_translation: comments.length === 0 ? '' : comment_translation,
                    // Actual data
                    id: motion.id,
                    identifier: motion.identifier,
                    title: motion.getTitle(),
                    submitters: _.map(motion.submitters, function (submitter) {
                                    return submitter.get_full_name();
                                }).join(', '),
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

        var getMotionComments = function (motion) {
            var fields = Config.get('motions_comments').value;
            fields = _.filter(fields, function (field) {
                return !field.forState && !field.forRecommendation;
            });
            var canSeeComment = function (index) {
                return fields[index].public || operator.hasPerms('motions.can_manage');
            };
            var comments = [];
            for (var i = 0; i < fields.length; i++) {
                if (motion.comments[i] && canSeeComment(i)) {
                    var title = gettextCatalog.getString('Comment') + ' ' + fields[i].name;
                    if (!fields[i].public) {
                        title += ' (' + gettextCatalog.getString('internal') + ')';
                    }
                    comments.push({
                        title: title,
                        comment: motion.comments[i],
                    });
                }
            }
            return comments;
        };

        return {
            export: function (motions, params) {
                converter = Html2DocxConverter.createInstance();
                if (!params) {
                    params = {};
                }
                _.defaults(params, {
                    filename: 'motions-export.docx',
                    changeRecommendationMode: Config.get('motions_recommendation_text_mode').value,
                    includeReason: true,
                    includeComments: false,
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
