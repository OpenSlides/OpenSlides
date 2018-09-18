(function () {

"use strict";

angular.module('OpenSlidesApp.motions.pdf', ['OpenSlidesApp.core.pdf'])

.factory('MotionContentProvider', [
    '$q',
    '$filter',
    'operator',
    'gettextCatalog',
    'PDFLayout',
    'PdfMakeConverter',
    'ImageConverter',
    'HTMLValidizer',
    'Category',
    'Config',
    'Motion',
    'MotionComment',
    'MotionPollDecimalPlaces',
    'OpenSlidesSettings',
    function($q, $filter, operator, gettextCatalog, PDFLayout, PdfMakeConverter, ImageConverter,
        HTMLValidizer, Category, Config, Motion, MotionComment, MotionPollDecimalPlaces, OpenSlidesSettings) {
        /**
         * Provides the content as JS objects for Motions in pdfMake context
         * @constructor
         */

        var createInstance = function(motion, motionVersion, params) {
            params = _.clone(params || {}); // Clone this to avoid sideeffects.
            _.defaults(params, {
                changeRecommendationMode: Config.get('motions_recommendation_text_mode').value,
                lineNumberMode: Config.get('motions_default_line_numbering').value,
                include: {
                    text: true,
                    reason: true,
                    state: true,
                    category: true,
                    submitters: true,
                    votingresult: true,
                    motionBlock: true,
                    origin: true,
                    recommendation: true,
                },
                includeComments: {},
            });

            var converter, imageMap = {};

            // Query all image sources from motion text and reason
            var getImageSources = function () {
                var text = motion.getTextByMode(params.changeRecommendationMode, null);
                var reason = motion.getReason();
                var comments = '';
                _.forEach(params.includeComments, function (ok, id) {
                    if (ok && motion.comments[id]) {
                        comments += HTMLValidizer.validize(motion.comments[id]);
                    }
                });
                var content = HTMLValidizer.validize(text) + HTMLValidizer.validize(motion.getReason()) + comments;
                var map = Function.prototype.call.bind([].map);
                return map($(content).find('img'), function(element) {
                    return element.getAttribute('src');
                });
            };

            // title
            var identifier = motion.identifier ? ' ' + motion.identifier : '';
            var titlePlain = motion.getTitleWithChanges(params.changeRecommendationMode, motionVersion);
            var title = PDFLayout.createTitle(gettextCatalog.getString('Motion') + identifier + ': ' + titlePlain);

            // subtitle and sequential number
            var subtitleLines = [];
            if (motion.parent_id) {
                var parentMotion = Motion.get(motion.parent_id);
                subtitleLines.push(
                    gettextCatalog.getString('Amendment to motion') + ': ' +
                    (parentMotion.identifier ? parentMotion.identifier : parentMotion.getTitle())
                );
            }
            if (Config.get('motions_export_sequential_number').value) {
                subtitleLines.push(gettextCatalog.getString('Sequential number') + ': ' +
                    motion.getSequentialNumber());
            }
            var subtitle = PDFLayout.createSubtitle(subtitleLines);

            // meta data table
            var metaTable = function() {
                var metaTableBody = [];

                // submitters
                var submitters = _.map(
                    $filter('orderBy')(motion.submitters, 'weight'), function (submitter) {
                        return submitter.user.get_full_name();
                    }
                ).join(', ');
                if (params.include.submitters) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Submitters') + ':',
                            style: ['bold', 'grey'],
                        },
                        {
                            text: submitters,
                            style: 'grey'
                        }
                    ]);
                }

                // state
                if (params.include.state) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('State') + ':',
                            style: ['bold', 'grey']
                        },
                        {
                            text: motion.getStateName(),
                            style: 'grey'
                        }
                    ]);
                }

                // recommendation
                if (params.include.recommendation && motion.getRecommendationName()) {
                    metaTableBody.push([
                        {
                            text: Config.get('motions_recommendations_by').value + ':',
                            style: ['bold', 'grey']
                        },
                        {
                            text: motion.getRecommendationName(),
                            style: 'grey'
                        }
                    ]);
                }

                // category
                if (params.include.category && motion.category) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Category') + ':',
                            style: ['bold', 'grey'] },
                        {
                            text: motion.category.prefix + ' - ' + motion.category.name,
                            style: 'grey'
                        }
                    ]);
                }

                // motion block
                if (params.include.motionBlock && motion.motionBlock) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Motion block') + ':',
                            style: ['bold', 'grey'] },
                        {
                            text: motion.motionBlock.title,
                            style: 'grey'
                        }
                    ]);
                }

                // origin
                if (params.include.origin && motion.origin) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Origin') + ':',
                            style: ['bold', 'grey'] },
                        {
                            text: motion.origin,
                            style: 'grey'
                        }
                    ]);
                }

                // voting result
                if (params.include.votingresult && motion.polls.length > 0 && motion.polls[0].has_votes) {
                    var column1 = [];
                    var column2 = [];
                    var column3 = [];
                    motion.polls.map(function(poll, index) {
                        if (poll.has_votes) {
                            // votenumber
                            if (motion.polls.length > 1) {
                                column1.push(index + 1 + '. ' + gettextCatalog.getString('Vote'));
                                column2.push('');
                                column3.push('');
                            }
                            var precision = MotionPollDecimalPlaces.getPlaces(poll);
                            // yes
                            var yes = poll.getVote(poll.yes, 'yes');
                            column1.push(gettextCatalog.getString('Yes') + ':');
                            column2.push($filter('number')(yes.value, precision));
                            column3.push(yes.percentStr);
                            // no
                            var no = poll.getVote(poll.no, 'no');
                            column1.push(gettextCatalog.getString('No') + ':');
                            column2.push($filter('number')(no.value, precision));
                            column3.push(no.percentStr);
                            // abstain
                            var abstain = poll.getVote(poll.abstain, 'abstain');
                            column1.push(gettextCatalog.getString('Abstain') + ':');
                            column2.push($filter('number')(abstain.value, precision));
                            column3.push(abstain.percentStr);
                            // votes valid
                            if (poll.votesvalid) {
                                var valid = poll.getVote(poll.votesvalid, 'votesvalid');
                                column1.push(gettextCatalog.getString('Valid votes') + ':');
                                column2.push($filter('number')(valid.value, precision));
                                column3.push(valid.percentStr);
                            }
                            // votes invalid
                            if (poll.votesvalid) {
                                var invalid = poll.getVote(poll.votesinvalid, 'votesinvalid');
                                column1.push(gettextCatalog.getString('Invalid votes') + ':');
                                column2.push($filter('number')(invalid.value, precision));
                                column3.push(invalid.percentStr);
                            }
                            // votes cast
                            if (poll.votescast) {
                                var cast = poll.getVote(poll.votescast, 'votescast');
                                column1.push(gettextCatalog.getString('Votes cast') + ':');
                                column2.push($filter('number')(cast.value, precision));
                                column3.push(cast.percentStr);
                            }
                        }
                    });
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Voting result') + ':',
                            style: ['bold', 'grey']
                        },
                        {
                            columns: [
                                {
                                    text: column1.join('\n'),
                                    width: 'auto'
                                },
                                {
                                    text: column2.join('\n'),
                                    width: 'auto',
                                    alignment: 'right'
                                },
                                {
                                    text: column3.join('\n'),
                                    width: 'auto',
                                    alignment: 'right'
                                },
                            ],
                            columnGap: 7,
                            style: 'grey'
                        }
                    ]);
                }

                // summary of change recommendations (for motion diff version only)
                if (params.changeRecommendationMode === 'diff' && motion.changeRecommendations.length) {
                    var columnLineNumbers = [];
                    var columnChangeType = [];
                    angular.forEach(_.orderBy(motion.changeRecommendations, ['line_from']), function(change) {
                        if (change.isTitleRecommendation()) {
                            columnLineNumbers.push(
                                gettextCatalog.getString('Title') + ': '
                            );
                        } else {
                            // line numbers column
                            var line;
                            if (change.line_from >= change.line_to - 1) {
                                line = change.line_from;
                            } else {
                                line = change.line_from + ' - ' + (change.line_to - 1);
                            }
                            columnLineNumbers.push(
                                gettextCatalog.getString('Line') + ' ' + line + ': '
                            );
                        }
                        // change type column
                        if (change.getType(motion.getVersion(motionVersion).text) === 0) {
                            columnChangeType.push(gettextCatalog.getString("Replacement"));
                        } else if (change.getType(motion.getVersion(motionVersion).text) === 1) {
                            columnChangeType.push(gettextCatalog.getString("Insertion"));
                        } else if (change.getType(motion.getVersion(motionVersion).text) === 2) {
                            columnChangeType.push(gettextCatalog.getString("Deletion"));
                        } else if (change.getType(motion.getVersion(motionVersion).text) === 3) {
                            columnChangeType.push(change.other_description);
                        }
                    });
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Summary of change recommendations'),
                            style: ['bold', 'grey']
                        },
                        {
                            columns: [
                                {
                                    text: columnLineNumbers.join('\n'),
                                    width: 'auto'
                                },
                                {
                                    text: columnChangeType.join('\n'),
                                    width: 'auto'
                                }
                            ],
                            columnGap: 7,
                            style: 'grey'
                        }
                    ]);
                }

                if (metaTableBody.length) {
                    // build table
                    // Used placeholder for 'layout' functions whiche are
                    // replaced by lineWitdh/lineColor function in pfd-worker.js.
                    // TODO: Remove placeholder and us static values for LineWidth and LineColor
                    // if pdfmake has fixed this.
                    var metaTable = {
                        table: {
                            widths: ['35%','65%'],
                            body: metaTableBody,
                        },
                        margin: [0, 0, 0, 20],
                        layout: '{{motion-placeholder-to-insert-functions-here}}'
                    };
                    params.include.metatable = true;
                    return metaTable;
                } else {
                    return {};
                }
            };

            // motion title
            var motionTitle = function() {
                if (params.include.metatable && params.include.text && !motion.isParagraphBasedAmendment()) {
                    return [{
                        text: titlePlain,
                        style: 'heading3'
                    }];
                } else {
                    return {};
                }
            };

            // motion preamble
            var motionPreamble = function () {
                return {
                    text: Config.translate(Config.get('motions_preamble').value),
                    margin: [0, 10, 0, 0]
                };
            };

            var escapeHtml = function(text) {
                return text.replace(/&/, '&amp;').replace(/</, '&lt;').replace(/>/, '&gt;');
            };

            // motion text (with line-numbers)
            var motionText = function() {
                var content = [];
                if (params.include.text) {
                    var motionTextContent = '';
                    if (motion.isParagraphBasedAmendment()) {
                        // paragraph based amendment
                        var diffs = motion.getAmendmentParagraphsLinesDiff();
                        if (diffs.length) {
                            content.push(motionPreamble());
                            _.forEach(diffs, function (diff) {
                                motionTextContent += diff.textPre + diff.text + diff.textPost;
                            });
                        } else {
                            motionTextContent += gettextCatalog.getString('No changes at the text.');
                        }
                    } else {
                        // lead motion or normal amendment
                        content.push(motionPreamble());
                        var titleChange = motion.getTitleChangeRecommendation();
                        if (params.changeRecommendationMode === 'diff' && titleChange) {
                            motionTextContent += '<p><strong>' + gettextCatalog.getString('New title') + ':</strong> ' +
                                escapeHtml(titleChange.text) + '</p>';
                        }
                        motionTextContent += motion.getTextByMode(params.changeRecommendationMode, motionVersion);
                    }
                    content.push(converter.convertHTML(motionTextContent, params.lineNumberMode));
                }
                return content;
            };

            // motion reason heading
            var motionReason = function() {
                if (params.include.reason) {
                    var reason = [];
                    if (motion.getReason(motionVersion)) {
                        reason.push({
                            text:  gettextCatalog.getString('Reason'),
                            style: 'heading3',
                            marginTop: 25,
                        });
                        var width;
                        if (params.lineNumberMode == 'outside') {
                            width = '80%';
                        } else {
                            width = '100%';
                        }
                        reason.push({
                            columns: [
                                {
                                    width: width,
                                    stack: converter.convertHTML(motion.getReason(motionVersion), 'none'),
                                },
                            ]
                        });
                    }
                    return reason;
                }
            };

            // motion comments handling
            var motionComments = function () {
                if (_.keys(params.includeComments).length !== 0) {
                    var fields = MotionComment.getNoSpecialCommentsFields();
                    var comments = [];
                    _.forEach(params.includeComments, function (ok, id) {
                        if (ok && motion.comments[id]) {
                            var title = fields[id].name;
                            if (!fields[id].public) {
                                title += ' (' + gettextCatalog.getString('internal') + ')';
                            }
                            comments.push({
                                text: title,
                                style: 'heading3',
                                marginTop: 25,
                            });
                            comments.push(converter.convertHTML(motion.comments[id]));
                        }
                    });
                    return comments;
                }
            };

            // Generates content as a pdfmake consumable
            var getContent = function() {
                var content = [
                    title,
                    subtitle,
                    metaTable(),
                    motionTitle()
                ];
                content = content.concat(motionText());

                var reason = motionReason();
                if (reason) {
                    content.push(reason);
                }
                var comments = motionComments();
                if (comments) {
                    content.push(comments);
                }
                return content;
            };

            // getters
            var getTitle = function() {
                return motion.getTitle(motionVersion);
            };

            var getIdentifier = function() {
                return motion.identifier ? motion.identifier : '';
            };

            var getId = function() {
                return motion.id;
            };

            var getCategory = function() {
                return motion.category;
            };

            var getImageMap = function() {
                return imageMap;
            };

            return $q(function (resolve, reject) {
                ImageConverter.toBase64(getImageSources()).then(function (_imageMap) {
                    imageMap = _imageMap;
                    converter = PdfMakeConverter.createInstance(_imageMap);
                    resolve({
                        getContent: getContent,
                        getTitle: getTitle,
                        getIdentifier: getIdentifier,
                        getId: getId,
                        getCategory: getCategory,
                        getImageMap: getImageMap,
                    });
                }, reject);
            });
        };

        return {
            createInstance: createInstance
        };
    }
])

.factory('MotionPartialContentProvider', [
    '$q',
    'gettextCatalog',
    'Config',
    'PDFLayout',
    'PdfMakeConverter',
    'ImageConverter',
    'HTMLValidizer',
    function ($q, gettextCatalog, Config, PDFLayout, PdfMakeConverter, ImageConverter, HTMLValidizer) {
        /*
         * content should be an array of content blocks. Each content is an object providing a
         * heading and a text. E.g.
         * [{heading: 'comment1', text: '<html in here>'}, {heading: ...}, ...]
         * */
        var createInstance = function (motion, content) {

            var converter, imageMap = {};

            // Query all image sources from the content
            var getImageSources = function () {
                var imageSources = [];
                _.forEach(content, function (contentBlock) {
                    var html = HTMLValidizer.validize(contentBlock.text);
                    imageSources = imageSources.concat(_.map($(html).find('img'), function(element) {
                        return element.getAttribute('src');
                    }));
                });
                return imageSources;
            };

            // title
            var identifier = motion.identifier ? ' ' + motion.identifier : '';
            var title = PDFLayout.createTitle(
                    gettextCatalog.getString('Motion') + identifier + ': ' + motion.getTitle()
            );

            // subtitle and sequential number
            var subtitleLines = [];
            if (motion.parent_id) {
                var parentMotion = Motion.get(motion.parent_id);
                subtitleLines.push(
                    gettextCatalog.getString('Amendment to motion') + ': ' +
                    (parentMotion.identifier ? parentMotion.identifier : parentMotion.getTitle())
                );
            }
            if (Config.get('motions_export_sequential_number').value) {
                subtitleLines.push(gettextCatalog.getString('Sequential number') + ': ' +  motion.id);
            }
            var subtitle = PDFLayout.createSubtitle(subtitleLines);

            // meta data table
            var metaTable = function() {
                var metaTableBody = [];

                // submitters
                var submitters = _.map(motion.submitters, function (submitter) {
                    return submitter.user.get_full_name();
                }).join(', ');
                metaTableBody.push([
                    {
                        text: gettextCatalog.getString('Submitters') + ':',
                        style: ['bold', 'grey'],
                    },
                    {
                        text: submitters,
                        style: 'grey'
                    }
                ]);

                // state
                metaTableBody.push([
                    {
                        text: gettextCatalog.getString('State') + ':',
                        style: ['bold', 'grey']
                    },
                    {
                        text: motion.getStateName(),
                        style: 'grey'
                    }
                ]);

                // recommendation
                if (motion.getRecommendationName()) {
                    metaTableBody.push([
                        {
                            text: Config.get('motions_recommendations_by').value + ':',
                            style: ['bold', 'grey']
                        },
                        {
                            text: motion.getRecommendationName(),
                            style: 'grey'
                        }
                    ]);
                }

                // category
                if (motion.category) {
                    metaTableBody.push([
                        {
                            text: gettextCatalog.getString('Category') + ':',
                            style: ['bold', 'grey'] },
                        {
                            text: motion.category.prefix + ' - ' + motion.category.name,
                            style: 'grey'
                        }
                    ]);
                }

                // build table
                // Used placeholder for 'layout' functions whiche are
                // replaced by lineWitdh/lineColor function in pfd-worker.js.
                // TODO: Remove placeholder and us static values for LineWidth and LineColor
                // if pdfmake has fixed this.
                var metaTableJsonString = {
                    table: {
                        widths: ['30%','70%'],
                        body: metaTableBody,
                    },
                    margin: [0, 0, 0, 20],
                    layout: '{{motion-placeholder-to-insert-functions-here}}'
                };
                return metaTableJsonString;
            };

            var getContentBlockData = function (block) {
                var data = [];
                data.push({
                    text:  block.heading,
                    style: 'heading3',
                    marginTop: 25,
                });
                data.push(converter.convertHTML(block.text));
                return data;
            };

            // Generates content as a pdfmake consumable
            var getContent = function() {
                var pdfContent = [
                    title,
                    subtitle,
                    metaTable(),
                ];
                _.forEach(content, function (contentBlock) {
                    pdfContent.push(getContentBlockData(contentBlock));
                });
                return pdfContent;
            };

            var getImageMap = function () {
                return imageMap;
            };

            return $q(function (resolve, reject) {
                ImageConverter.toBase64(getImageSources()).then(function (_imageMap) {
                    imageMap = _imageMap;
                    converter = PdfMakeConverter.createInstance(_imageMap);
                    resolve({
                        getContent: getContent,
                        getImageMap: getImageMap,
                    });
                }, reject);
            });
        };

        return {
            createInstance: createInstance
        };
    }
])

.factory('PollContentProvider', [
    '$q',
    'PDFLayout',
    'gettextCatalog',
    'Config',
    'User',
    'ImageConverter',
    function($q, PDFLayout, gettextCatalog, Config, User, ImageConverter) {
        /**
        * Generates a content provider for polls
        * @constructor
        * @param {string} title - title of poll
        * @param {string} id - if of poll
        */
        var createInstance = function(title, id) {

            var logoBallotPaperUrl = Config.get('logo_pdf_ballot_paper').value.path;
            var imageMap = {};

            // PDF header
            var header = function() {
                var columns = [];

                var text = Config.get('general_event_name').value;
                columns.push({
                    text: text,
                    fontSize: 8,
                    alignment: 'left',
                    width: '60%'
                });

                // logo
                if (logoBallotPaperUrl) {
                    columns.push({
                        image: logoBallotPaperUrl,
                        fit: [90,25],
                        alignment: 'right',
                        width: '40%'
                    });
                }
                return {
                    color: '#555',
                    fontSize: 10,
                    margin: [30, 10, 10, -10], // [left, top, right, bottom]
                    columns: columns,
                    columnGap: 5
                };
            };

            /**
            * Returns a single section on the ballot paper
            * @function
            */
            var createSection = function() {
                var sheetend = 40;
                return {
                    stack: [
                        header(),
                        {
                            text: gettextCatalog.getString('Motion') + ' ' + id,
                            style: 'title',
                        },
                        {
                            text: title,
                            style: 'description'
                        },
                        PDFLayout.createBallotEntry(gettextCatalog.getString('Yes')),
                        PDFLayout.createBallotEntry(gettextCatalog.getString('No')),
                        PDFLayout.createBallotEntry(gettextCatalog.getString('Abstain')),
                    ],
                    margin: [0, 0, 0, sheetend],
                };
            };

            /**
            * Returns Content for single motion
            * @function
            * @param {string} id - if of poll
            */
            var getContent = function() {
                var content = [];
                var amount;
                var amount_method = Config.get('motions_pdf_ballot_papers_selection').value;
                switch (amount_method) {
                        case 'NUMBER_OF_ALL_PARTICIPANTS':
                            amount = User.getAll().length;
                            break;
                        case 'NUMBER_OF_DELEGATES':
                            //TODO: assumption that DELEGATES is always group id 2. This may not be true
                            var group_id = 2;
                            amount = User.filter({where: {'groups_id': {contains:group_id} }}).length;
                            break;
                        case 'CUSTOM_NUMBER':
                            amount = Config.get('motions_pdf_ballot_papers_number').value;
                            break;
                        default:
                            // should not happen.
                            amount = 0;
                }
                var fullpages = Math.floor(amount / 8);

                for (var i=0; i < fullpages; i++) {
                    content.push({
                        table: {
                            headerRows: 1,
                            widths: ['*', '*'],
                            body: [
                                [createSection(), createSection()],
                                [createSection(), createSection()],
                                [createSection(), createSection()],
                                [createSection(), createSection()]
                            ],
                            pageBreak: 'after'
                        },
                        layout: PDFLayout.getBallotLayoutLines(),
                        rowsperpage: 4
                    });
                }
                amount = amount  - (fullpages * 8);
                if (amount > 0) {
                    var partialpagebody = [];
                    while (amount > 1) {
                        partialpagebody.push([createSection(), createSection()]);
                        amount -=2;
                    }
                    if (amount == 1) {
                        partialpagebody.push([createSection(), '']);
                    }
                    content.push({
                        table: {
                            headerRows: 1,
                            widths: ['50%', '50%'],
                            body: partialpagebody
                        },
                        layout: PDFLayout.getBallotLayoutLines(),
                        rowsperpage: 4
                    });
                }
                return content;
            };

            var getImageMap = function () {
                return imageMap;
            };

            return $q(function (resolve, reject) {
                var imageSources = [
                    logoBallotPaperUrl,
                ];
                ImageConverter.toBase64(imageSources).then(function (_imageMap) {
                    imageMap = _imageMap;
                    resolve({
                        getContent: getContent,
                        getImageMap: getImageMap,
                    });
                }, reject);
            });
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('MotionCatalogContentProvider', [
    'gettextCatalog',
    'PDFLayout',
    'Category',
    'Config',
    function(gettextCatalog, PDFLayout, Category, Config) {
        /**
        * Constructor
        * @function
        * @param {object} allMotions - A sorted array of all motions to parse
        * @param {string} sorting - The way the catalog has been sorted. Necessary for ToC
        */
        var createInstance = function(allMotions, sorting) {

            var title = PDFLayout.createTitle(
                Config.translate(Config.get('motions_export_title').value)
            );

            var createPreamble = function() {
                var preambleText = Config.get('motions_export_preamble').value;
                if (preambleText) {
                    return {
                        text: preambleText,
                        style: "preamble"
                    };
                } else {
                    return "";
                }
            };

            var createTOContent = function() {
                var toc = [];
                var exportCategory = (sorting === 'identifier' || sorting === 'category.prefix');
                var uniqueCategories = getUniqueCategories();
                var tocTitle = {
                    text: gettextCatalog.getString('Table of contents'),
                    style: 'heading2'
                };

                // all motions need a page ID. We use the motion identifier for that
                _.forEach(allMotions, function (motion) {
                    motion.getContent()[0].id = ''+motion.getId();
                });

                if (exportCategory && uniqueCategories) {
                    // own table per category
                    var catTocBody = [];
                    _.forEach(uniqueCategories, function (category) {
                        // push the name of the category
                        // make a table for correct alignment
                        catTocBody.push({
                            table: {
                                body: [
                                    [
                                        {
                                            text: category.prefix + ' - ' + category.name,
                                            style: 'tocCategoryTitle'
                                        }
                                    ],
                                ]
                            },
                            layout: 'noBorders',
                        });

                        var tocBody = [];
                        _.forEach(allMotions, function (motion) {
                            if (motion.getCategory() && category.name === motion.getCategory().name) {
                                tocBody.push(tocLine(motion, 'tocCategoryEntry'));
                            }
                        });
                        catTocBody.push(tocTable(tocBody));
                    });

                    //handle thouse without category
                    var uncatTocBody = [];
                    _.forEach(allMotions, function (motion) {
                        if (!motion.getCategory()) {
                            uncatTocBody.push(tocLine(motion, 'tocEntry'));
                        }
                    });

                    // only push this array if there is at least one entry
                    if (uncatTocBody.length > 0) {
                        catTocBody.push(tocTable(uncatTocBody));
                    }

                    toc.push(catTocBody);
                } else {
                    // all categories in the same table
                    var tocBody = [];
                    _.forEach(allMotions, function (motion) {
                        tocBody.push(tocLine(motion, 'tocEntry'));
                    });
                    toc.push(tocTable(tocBody));
                }

                return [
                    tocTitle,
                    toc,
                    PDFLayout.addPageBreak()
                ];
            };

            // creates a new table of contents table body
            var tocTable = function (tocBody) {
                return {
                    table: {
                        widths: ['auto', '*', 'auto'],
                        body: tocBody
                    },
                    layout: 'noBorders',
                    style: 'tocCategorySection'
                };
            };

            // generates a line in the toc as list-object
            var tocLine = function (motion, style) {
                var firstColumn = "";
                if (motion.getIdentifier()) {
                    firstColumn = motion.getIdentifier();
                }
                return [
                    {
                        text: firstColumn,
                        style: style
                    },
                    {
                        text: motion.getTitle(),
                        style: 'tocEntry'
                    },
                    {
                        pageReference: ''+motion.getId(),
                        style: 'tocEntry',
                        alignment: 'right'
                    },
                ];
            };

            // returns a list of unique category names
            // necessary to create a ToC with categories
            // if a motions without category is found,
            // a corresponding entry should be added aswell
            var getUniqueCategories = function() {
                var categories = [];
                _.forEach(allMotions, function (motion) {
                    if (motion.getCategory()) {
                        categories.push(
                            {
                                name: motion.getCategory().name,
                                prefix: motion.getCategory().prefix
                            }
                        );
                    }
                });
                return _.uniqBy(categories, 'name');
            };

            // returns the pure content of the motion, parseable by pdfmake
            var getContent = function() {
                var motionContent = [];
                _.forEach(allMotions, function(motion, key) {
                    motionContent.push(motion.getContent());
                    if (key < allMotions.length - 1) {
                        motionContent.push(PDFLayout.addPageBreak());
                    }
                });
                var content = [];
                // print extra data (title, preamble, categories, toc) only for more than 1 motion
                if (allMotions.length > 1) {
                    content.push(
                        title,
                        createPreamble(),
                        createTOContent()
                    );
                }
                content.push(motionContent);
                return content;
            };

            var getImageMap = function () {
                var imageMap = {};
                _.forEach(allMotions, function (motion) {
                    _.forEach(motion.getImageMap(), function (data, path) {
                        if (!imageMap[path]) {
                            imageMap[path] = data;
                        }
                    });
                });
                return imageMap;
            };

            return {
                getContent: getContent,
                getImageMap: getImageMap,
            };
        };

        return {
            createInstance: createInstance
        };
    }
])

.factory('AmendmentContentProvider', [
    '$q',
    'ImageConverter',
    'PdfMakeConverter',
    'HTMLValidizer',
    'PDFLayout',
    'Config',
    'gettextCatalog',
    function ($q, ImageConverter, PdfMakeConverter, HTMLValidizer, PDFLayout, Config, gettextCatalog) {
        var createInstance = function (motions) {
            motions = _.filter(motions, function (motion) {
                return motion.parent_id;
            });

            var converter, imageMap = {};

            // Query all image sources from motion text and reason
            var getImageSources = function () {
                var sources = [];
                _.forEach(motions, function (motion) {
                    var text = motion.getText();
                    var reason = motion.getReason();
                    var content = HTMLValidizer.validize(text) + HTMLValidizer.validize(motion.getReason());
                    _.forEach($(content).find('img'), function (element) {
                        sources.push(element.getAttribute('src'));
                    });
                });
                return _.uniq(sources);
            };

            var createBundleContent = function (bundle) {
                return _.flatten(_.map(bundle, function (motion) {
                    var content = [];

                    // get diffs and title of the changed motions
                    var motionText;
                    var title = motion.identifier ? gettextCatalog.getString('Motion') + ' ' + motion.identifier : motion.getTitle();
                    if (motion.isParagraphBasedAmendment()) {
                        // get changed parts
                        var paragraphs = motion.getAmendmentParagraphsLinesDiff();
                        if (paragraphs.length) {
                            // Put the changed lines into the info column
                            var p = paragraphs[0];
                            title += ' (' + gettextCatalog.getString('Line') + ' ';
                            if (p.diffLineTo === p.diffLineFrom + 1) {
                                title += p.diffLineFrom;
                            } else {
                                title += p.diffLineFrom + '-' + p.diffLineTo;
                            }
                            title += ')';

                            // get the diff
                            motionText = p.text;
                        } else {
                            motionText = gettextCatalog.getString('No changes at the text.');
                        }
                    } else { // 'normal' amendment
                        motionText = motion.getText();
                    }
                    content.push({
                        text: title,
                        style: 'heading3',
                        marginTop: 15,
                    });

                    // submitters
                    var submitters = _.map(motion.submitters, function (submitter) {
                        return submitter.user.get_full_name();
                    }).join(', ');
                    content.push({
                        text: gettextCatalog.getString('Submitters') + ': ' + submitters,
                    });

                    // state
                    content.push({
                        text: gettextCatalog.getString('State') + ': ' + motion.getStateName(),
                    });

                    // recommendation
                    var recommendations_by = Config.get('motions_recommendations_by').value;
                    var recommendation = motion.getRecommendationName();
                    if (recommendations_by && recommendation) {
                        content.push({
                            text: recommendations_by + ': ' + recommendation,
                        });
                    }

                    return _.concat(content, converter.convertHTML(motionText, 'outside'));
                }));
            };

            var getBundleContent = function (bundle) {
                var leadMotion = bundle[0].getParentMotion();
                // title
                var title = leadMotion.identifier ? ' ' + leadMotion.identifier : '';
                title += ': ' + leadMotion.getTitle();
                title = PDFLayout.createTitle(gettextCatalog.getString('Amendments to motion') + title);

                var content = [title],
                    foundAmendments = [];

                var headings = leadMotion.getTextHeadings().map(function(heading) {
                    heading.amendments = [];
                    return heading;
                });
                bundle.forEach(function(amendment) {
                    var headingIdx = null;
                    var changes = amendment.getAmendmentParagraphsByMode('diff');
                    if (changes.length === 0) {
                        return;
                    }
                    var amendmentLineNumber = changes[0].lineFrom;
                    for (var i = 0; i < headings.length; i++) {
                        if (headings[i].lineNumber <= amendmentLineNumber) {
                            headingIdx = i;
                        }
                    }
                    if (headingIdx !== null) {
                        headings[headingIdx].amendments.push(amendment);
                        foundAmendments.push(amendment.id);
                    }
                });

                headings.forEach(function(heading) {
                    if (heading.amendments.length === 0) {
                        return;
                    }
                    content.push({
                        text: heading.text,
                        style: "heading2",
                        marginTop: 25,
                    });
                    content = _.concat(content, createBundleContent(heading.amendments));
                });

                // If there was an amendment that did not have a heading, we append it at the bottom
                var missedAmendments = [];
                bundle.forEach(function(amendment) {
                    if (foundAmendments.indexOf(amendment.id) === -1) {
                        missedAmendments.push(amendment);
                    }
                });
                if (missedAmendments.length > 0) {
                    content = _.concat(content, createBundleContent(missedAmendments));
                }

                return content;
            };

            // Generates content as a pdfmake consumable
            var getContent = function() {
                if (motions.length === 0) {
                    return [];
                }

                // Creates bundles of motions. All motions with the same parent are bundled together
                // respecting the order, in which they are sorted.
                // motionBundles is an array containing Arrays of motions with the same parent.
                var parentId = motions[0].parent_id;
                var motionBundles = [];
                var currentBundle = [];
                _.forEach(motions, function (motion) {
                    if (motion.parent_id === parentId) {
                        currentBundle.push(motion);
                    } else {
                        motionBundles.push(currentBundle);
                        currentBundle = [motion];
                        parentId = motion.parent_id;
                    }
                });
                motionBundles.push(currentBundle);

                // Make the amendment table for each motion bundle.
                return _.map(motionBundles, function (bundle, index) {
                    var content = getBundleContent(bundle);
                    if (index < motionBundles.length - 1) {
                        content.push(PDFLayout.addPageBreak());
                    }
                    return content;
                });
            };

            var getImageMap = function() {
                return imageMap;
            };

            return $q(function (resolve) {
                ImageConverter.toBase64(getImageSources()).then(function (_imageMap) {
                    imageMap = _imageMap;
                    converter = PdfMakeConverter.createInstance(_imageMap);
                    resolve({
                        getContent: getContent,
                        getImageMap: getImageMap,
                    });
                });
            });
        };

        return {
            createInstance: createInstance,
        };
    }
])

.factory('MotionPdfExport', [
    '$http',
    '$q',
    'operator',
    'Config',
    'gettextCatalog',
    'MotionChangeRecommendation',
    'HTMLValidizer',
    'PdfMakeConverter',
    'MotionContentProvider',
    'MotionCatalogContentProvider',
    'PdfMakeDocumentProvider',
    'PollContentProvider',
    'PdfMakeBallotPaperProvider',
    'MotionPartialContentProvider',
    'AmendmentContentProvider',
    'PdfCreate',
    'PDFLayout',
    'PersonalNoteManager',
    'MotionComment',
    'Messaging',
    'FileSaver',
    function ($http, $q, operator, Config, gettextCatalog, MotionChangeRecommendation, HTMLValidizer,
        PdfMakeConverter, MotionContentProvider, MotionCatalogContentProvider, PdfMakeDocumentProvider,
        PollContentProvider, PdfMakeBallotPaperProvider, MotionPartialContentProvider, AmendmentContentProvider,
        PdfCreate, PDFLayout, PersonalNoteManager, MotionComment, Messaging, FileSaver) {
        return {
            getDocumentProvider: function (motions, params, singleMotion) {
                params = _.clone(params || {}); // Clone this to avoid sideeffects.

                if (singleMotion) {
                    _.defaults(params, {
                        version: motions.active_version,
                    });
                    motions = [motions];
                }

                //save the arrays of all motions to an array
                angular.forEach(motions, function (motion) {
                    if (singleMotion) {
                        motion.changeRecommendations = MotionChangeRecommendation.filter({
                            'where': {'motion_version_id': {'==': params.version}}
                        });
                    } else {
                        motion.changeRecommendations = MotionChangeRecommendation.filter({
                            'where': {'motion_version_id': {'==': motion.active_version}}
                        });
                    }
                });

                var motionContentProviderArray = [];
                var motionContentProviderPromises = _.map(motions, function (motion) {
                    var version = (singleMotion ? params.version : motion.active_version);
                    return $q(function (resolve, reject) {
                        MotionContentProvider.createInstance(
                            motion, version, params
                        ).then(function (contentProvider) {
                            motionContentProviderArray.push(contentProvider);
                            resolve();
                        }, reject);
                    });
                });

                return $q(function (resolve, reject) {
                    $q.all(motionContentProviderPromises).then(function() {
                        var documentProviderPromise;
                        if (singleMotion) {
                            documentProviderPromise = PdfMakeDocumentProvider.createInstance(motionContentProviderArray[0]);
                        } else {
                            var motionCatalogContentProvider = MotionCatalogContentProvider.createInstance(motionContentProviderArray, params.column);
                            documentProviderPromise = PdfMakeDocumentProvider.createInstance(motionCatalogContentProvider);
                        }
                        documentProviderPromise.then(function (documentProvider) {
                            resolve(documentProvider);
                        }, reject);
                    }, reject);
                });
            },
            export: function (motions, params, singleMotion) {
                params = params || {};
                params.filename = gettextCatalog.getString('motions') + '.pdf';
                this.getDocumentProvider(motions, params, singleMotion).then(
                    function (documentProvider) {
                        PdfCreate.download(documentProvider, params.filename);
                    }, function (error) {
                        Messaging.addMessage(error.msg, 'error');
                    }
                );
            },
            exportZip: function (motions, params) {
                var messageId = Messaging.addMessage('<i class="fa fa-spinner fa-pulse fa-lg spacer-right"></i>' +
                    gettextCatalog.getString('Generating PDFs and ZIP archive') + ' ...', 'info');
                var zipFilename = params.filename || gettextCatalog.getString('motions') + '.zip';
                params.filename = void 0; // clear this, so we do not override the default filenames for each pdf.

                var self = this;
                var usedFilenames = [];
                var docMap = {};
                var docPromises = _.map(motions, function (motion) {
                    var identifier = motion.identifier ? '-' + motion.identifier : '';
                    var filename = gettextCatalog.getString('Motion') + identifier;

                    // If the filename is already in use, try to append a number to it (like '(2)')
                    if (_.includes(usedFilenames, filename)) {
                        var i = 1;
                        var filenameWithNumber = filename;
                        while(_.includes(usedFilenames, filenameWithNumber)) {
                            filenameWithNumber = filename + ' (' + i + ')';
                            i++;
                        }
                        filename = filenameWithNumber;
                    }
                    usedFilenames.push(filename);
                    filename += '.pdf';

                    return $q(function (resolve, reject) {
                        // get documentProvider for every motion.
                        self.getDocumentProvider(motion, params, true).then(function (documentProvider) {
                            docMap[filename] = documentProvider;
                            resolve();
                        }, reject);
                    });
                });
                $q.all(docPromises).then(function () {
                    PdfCreate.getBase64FromMultipleDocuments(docMap).then(function (pdfMap) {
                        var zip = new JSZip();
                        _.forEach(pdfMap, function (data, filename) {
                            zip.file(filename, data, {base64: true});
                        });
                        Messaging.createOrEditMessage(messageId, '<i class="fa fa-check fa-lg spacer-right"></i>' +
                            gettextCatalog.getString('ZIP successfully generated.'), 'success', {timeout: 3000});
                        zip.generateAsync({type: 'blob'}).then(function (content) {
                            FileSaver.saveAs(content, zipFilename);
                        });
                    }, function (error) {
                        Messaging.createOrEditMessage(messageId, '<i class="fa fa-exclamation-triangle fa-lg ' +
                            'spacer-right"></i>' + gettextCatalog.getString('Error while generating ZIP file') +
                            ': <code>' + error + '</code>', 'error');
                    });
                }, function (error) {
                    Messaging.createOrEditMessage(messageId, error.msg, 'error');
                });
            },
            createPollPdf: function (motion, version) {
                var id = motion.identifier.replace(' ', '');
                var title = motion.getTitle(version);
                var filename = gettextCatalog.getString('Motion') + '-' + id + '-' + gettextCatalog.getString('ballot-paper') + '.pdf';
                PollContentProvider.createInstance(title, id).then(function (pollContentProvider) {
                    var documentProvider = PdfMakeBallotPaperProvider.createInstance(pollContentProvider);
                    PdfCreate.download(documentProvider, filename);
                }, function (error) {
                    Messaging.addMessage(error.msg, 'error');
                });
            },
            exportPersonalNote: function (motion, filename) {
                var personalNote = PersonalNoteManager.getNote(motion);
                var content = [{
                    heading: gettextCatalog.getString('Personal note'),
                    text: personalNote ? personalNote.note : '',
                }];
                MotionPartialContentProvider.createInstance(motion, content).then(function (contentProvider) {
                    PdfMakeDocumentProvider.createInstance(contentProvider).then(function (documentProvider) {
                        PdfCreate.download(documentProvider, filename);
                    }, function (error) {
                        Messaging.addMessage(error.msg, 'error');
                    });
                }, function (error) {
                    Messaging.addMessage(error.msg, 'error');
                });
            },
            exportComment: function (motion, commentId, filename) {
                var field = MotionComment.getNoSpecialCommentsFields()[commentId];
                if (field && motion.comments[commentId]) {
                    var title = field.name;
                    if (!field.public) {
                        title += ' (' + gettextCatalog.getString('internal') + ')';
                    }
                    var content = [{
                        heading: title,
                        text: motion.comments[commentId],
                    }];
                    MotionPartialContentProvider.createInstance(motion, content).then(function (contentProvider) {
                        PdfMakeDocumentProvider.createInstance(contentProvider).then(function (documentProvider) {
                            PdfCreate.download(documentProvider, filename);
                        }, function (error) {
                            Messaging.addMessage(error.msg, 'error');
                        });
                    }, function (error) {
                        Messaging.addMessage(error.msg, 'error');
                    });
                }
            },
            exportAmendments: function (motions, filename) {
                AmendmentContentProvider.createInstance(motions).then(function (contentProvider) {
                    PdfMakeDocumentProvider.createInstance(contentProvider).then(function (documentProvider) {
                        PdfCreate.download(documentProvider, filename);
                    });
                });
            },
        };
    }
]);

}());
