(function () {

"use strict";

angular.module('OpenSlidesApp.motions.pdf', ['OpenSlidesApp.core.pdf'])

.factory('MotionContentProvider', [
    'gettextCatalog',
    'PDFLayout',
    'Category',
    'Config',
    'Motion',
    function(gettextCatalog, PDFLayout, Category, Config, Motion) {
    /**
     * Provides the content as JS objects for Motions in pdfMake context
     * @constructor
     */

    var createInstance = function(converter, motion, $scope) {

        // title
        var identifier = motion.identifier ? ' ' + motion.identifier : '';
        var title = PDFLayout.createTitle(
                gettextCatalog.getString('Motion') + identifier + ': ' +
                motion.getTitle($scope.version)
        );

        // subtitle
        var subtitleLines = [];
        if (motion.parent_id) {
            var parentMotion = Motion.get(motion.parent_id);
            subtitleLines.push(
                gettextCatalog.getString('Amendment of motion') + ': ' +
                (parentMotion.identifier ? parentMotion.identifier : parentMotion.getTitle())
            );
        }
        subtitleLines.push(gettextCatalog.getString('Sequential number') + ': ' +  motion.id);
        var subtitle = PDFLayout.createSubtitle(subtitleLines);

        // meta data table
        var metaTable = function() {
            var metaTableBody = [];

            // submitters
            var submitters = _.map(motion.submitters, function (submitter) {
                return submitter.get_full_name();
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
                        text: motion.category.name,
                        style: 'grey'
                    }
                ]);
            }

            // voting result
            if (motion.polls.length > 0 && motion.polls[0].has_votes) {
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
                        // yes
                        var yes = poll.getVote(poll.yes, 'yes');
                        column1.push(gettextCatalog.getString('Yes') + ':');
                        column2.push(yes.value);
                        column3.push(yes.percentStr);
                        // no
                        var no = poll.getVote(poll.no, 'no');
                        column1.push(gettextCatalog.getString('No') + ':');
                        column2.push(no.value);
                        column3.push(no.percentStr);
                        // abstain
                        var abstain = poll.getVote(poll.abstain, 'abstain');
                        column1.push(gettextCatalog.getString('Abstain') + ':');
                        column2.push(abstain.value);
                        column3.push(abstain.percentStr);
                        // votes valid
                        if (poll.votesvalid) {
                            var valid = poll.getVote(poll.votesvalid, 'votesvalid');
                            column1.push(gettextCatalog.getString('Valid votes') + ':');
                            column2.push(valid.value);
                            column3.push(valid.percentStr);
                        }
                        // votes invalid
                        if (poll.votesvalid) {
                            var invalid = poll.getVote(poll.votesinvalid, 'votesinvalid');
                            column1.push(gettextCatalog.getString('Invalid votes') + ':');
                            column2.push(invalid.value);
                            column3.push(invalid.percentStr);
                        }
                        // votes cast
                        if (poll.votescast) {
                            var cast = poll.getVote(poll.votescast, 'votescast');
                            column1.push(gettextCatalog.getString('Votes cast') + ':');
                            column2.push(cast.value);
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
            if ($scope.viewChangeRecommendations) {
                if ($scope.viewChangeRecommendations.mode == "diff") {
                    var columnLineNumbers = [];
                    var columnChangeType = [];
                    angular.forEach($scope.change_recommendations, function(change) {
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
                        // change type column
                        if (change.getType(motion.getVersion($scope.version).text) === 0) {
                            columnChangeType.push(gettextCatalog.getString("Replacement"));
                        } else if (change.getType(motion.getVersion($scope.version).text) === 1) {
                            columnChangeType.push(gettextCatalog.getString("Insertion"));
                        } else if (change.getType(motion.getVersion($scope.version).text) === 2) {
                            columnChangeType.push(gettextCatalog.getString("Deletion"));
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

        // motion title
        var motionTitle = function() {
            return [{
                text: motion.getTitle($scope.version),
                style: 'heading3'
            }];
        };

        // motion preamble
        var motionPreamble = function () {
            return {
                text: Config.translate(Config.get('motions_preamble').value),
                margin: [0, 10, 0, 0]
            };
        };


        // motion text (with line-numbers)
        var motionText = function() {
            if ($scope.lineNumberMode == "inline" || $scope.lineNumberMode == "outside") {
                /* in order to distinguish between the line-number-types we need to pass the scope
                * to the convertHTML function.
                * We should avoid this, since this completly breaks compatibilty for every
                * other project that might want to use this HTML to PDF parser.
                * https://github.com/OpenSlides/OpenSlides/issues/2361
                */
                var text = motion.getTextByMode($scope.viewChangeRecommendations.mode, $scope.version);
                return converter.convertHTML(text, $scope.lineNumberMode);
            } else {
                return converter.convertHTML(motion.getText($scope.version), $scope.lineNumberMode);
            }
        };

        // motion reason heading
        var motionReason = function() {
            var reason = [];
            if (motion.getReason($scope.version)) {
                reason.push({
                    text:  gettextCatalog.getString('Reason'),
                    style: 'heading3',
                    marginTop: 25,
                });
                reason.push(converter.convertHTML(motion.getReason($scope.version), $scope.lineNumberMode));
            }
            return reason;
        };


        // getters
        var getTitle = function() {
            return motion.getTitle($scope.version);
        };

        var getIdentifier = function() {
            return motion.identifier ? motion.identifier : '';
        };

        var getCategory = function() {
            return motion.category;
        };

        // Generates content as a pdfmake consumable
        var getContent = function() {
            var content = [
                title,
                subtitle,
                metaTable(),
                motionTitle(),
                motionPreamble(),
                motionText(),
            ];
            if (motionReason()) {
                content.push(motionReason());
            }
            return content;
        };
        return {
            getContent: getContent,
            getTitle: getTitle,
            getIdentifier: getIdentifier,
            getCategory: getCategory
        };
    };

    return {
        createInstance: createInstance
    };
}])

.factory('PollContentProvider', [
    'PDFLayout',
    'Config',
    'User',
    function(PDFLayout, Config, User) {
    /**
    * Generates a content provider for polls
    * @constructor
    * @param {string} title - title of poll
    * @param {string} id - if of poll
    * @param {object} gettextCatalog - for translation
    */
    var createInstance = function(title, id, gettextCatalog) {

        /**
        * Returns a single section on the ballot paper
        * @function
        */
        var createSection = function() {
            var sheetend = 75;
            return {
                stack: [{
                    text: gettextCatalog.getString("Motion") + " " + id,
                    style: 'title',
                }, {
                    text: title,
                    style: 'description'
                },
                PDFLayout.createBallotEntry(gettextCatalog.getString("Yes")),
                PDFLayout.createBallotEntry(gettextCatalog.getString("No")),
                PDFLayout.createBallotEntry(gettextCatalog.getString("Abstain")),
                ],
                margin: [0, 0, 0, sheetend]
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

        return {
            getContent: getContent,
        };
    };
    return {
        createInstance: createInstance
    };
}])

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
    * @param {object} $scope - Current $scope
    */
    var createInstance = function(allMotions, $scope) {

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
            var heading = {
                text: gettextCatalog.getString("Table of contents"),
                style: "heading2"
            };

            var toc = [];
            angular.forEach(allMotions, function(motion) {
                var identifier = motion.getIdentifier() ? motion.getIdentifier() : '';
                toc.push(
                    {
                        columns: [
                            {
                                text: identifier,
                                style: 'tableofcontent',
                                width: 30
                            },
                            {
                                text: motion.getTitle(),
                                style: 'tableofcontent'
                            }
                        ]
                    }
                );
            });

            return [
                heading,
                toc,
                PDFLayout.addPageBreak()
            ];
        };

        // function to create the table of catergories (if any)
        var createTOCategories = function() {
            if (Category.getAll().length > 0) {
                var heading = {
                    text: gettextCatalog.getString("Categories"),
                    style: "heading2"
                };

                var toc = [];
                angular.forEach(Category.getAll(), function(cat) {
                    toc.push(
                        {
                            columns: [
                                {
                                    text: cat.prefix,
                                    style: 'tableofcontent',
                                    width: 30
                                },
                                {
                                    text: cat.name,
                                    style: 'tableofcontent'
                                }
                            ]
                        }
                    );
                });

                return [
                    heading,
                    toc,
                    PDFLayout.addPageBreak()
                ];
            } else {
                // if there are no categories, return "empty string"
                // pdfmake takes "null" literally and throws an error
                return "";
            }
        };

        // returns the pure content of the motion, parseable by makepdf
        var getContent = function() {
            var motionContent = [];
            angular.forEach(allMotions, function(motion, key) {
                motionContent.push(motion.getContent());
                if (key < allMotions.length - 1) {
                    motionContent.push(PDFLayout.addPageBreak());
                }
            });

            return [
                title,
                createPreamble(),
                createTOCategories(),
                createTOContent(),
                motionContent
            ];
        };
        return {
            getContent: getContent
        };
    };

    return {
        createInstance: createInstance
    };
}]);

}());
