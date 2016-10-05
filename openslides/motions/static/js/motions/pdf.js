(function () {

"use strict";

angular.module('OpenSlidesApp.motions.pdf', [])

.factory('MotionContentProvider', ['gettextCatalog', function(gettextCatalog) {
    /**
     * Provides the content as JS objects for Motions in pdfMake context
     * @constructor
     */

    var createInstance = function(converter, motion, $scope, User) {

        // generates the text of the motion. Also septerates between line-numbers
        var textContent = function() {
            if ($scope.lineNumberMode == "inline" || $scope.lineNumberMode == "outside") {
                /* in order to distinguish between the line-number-types we need to pass the scope
                * to the convertHTML function.
                * We should avoid this, since this completly breaks compatibilty for every
                * other project that might want to use this HTML to PDF parser.
                * https://github.com/OpenSlides/OpenSlides/issues/2361
                */
                return converter.convertHTML(motion.getTextWithLineBreaks($scope.version), $scope);
            } else {
                return converter.convertHTML(motion.getText($scope.version), $scope);
            }
        };

        // Generate text of reason
        var reasonContent = function() {
            return converter.convertHTML(motion.getReason($scope.version), $scope);
        };

        // Generate header text of motion
        var motionHeader = function() {
            var header = converter.createElement("text", gettextCatalog.getString("Motion") + " " + motion.identifier + ": " + motion.getTitle($scope.version));
            header.bold = true;
            header.fontSize = 26;
            return header;
        };

        // Generate text of signment
        var signment = function() {
            var label = converter.createElement("text", gettextCatalog.getString('Submitter') + ':\nStatus:');
            var state = converter.createElement("text", User.get(motion.submitters_id[0]).full_name + '\n'+gettextCatalog.getString(motion.state.name));
            state.width = "70%";
            label.width = "30%";
            label.bold = true;
            var signment = converter.createElement("columns", [label, state]);
            signment.margin = [10, 20, 0, 10];
            signment.lineHeight = 2.5;
            return signment;
        };

        // Generates polls
        var polls = function() {
            if (!motion.polls.length) return {};
            var pollLabel = converter.createElement("text", gettextCatalog.getString('Voting result') + ":"),
                results = function() {
                    return motion.polls.map(function(poll, index) {
                        var id = index + 1,
                            yes = poll.yes ? poll.yes : '-', // if no poll.yes is given set it to '-'
                            yesRelative = poll.getVote(poll.yes, 'yes').percentStr,
                            no = poll.no ? poll.no : '-',
                            noRelative = poll.getVote(poll.no, 'no').percentStr,
                            abstain = poll.abstain ? poll.abstain : '-',
                            abstainrelativeGet = poll.getVote(poll.abstain, 'abstain').percentStr,
                            abstainRelative = abstainrelativeGet ? abstainrelativeGet : '',
                            valid = poll.votesvalid  ? poll.votesvalid : '-',
                            validRelative = poll.getVote(poll.votesvalid, 'votesvalid').percentStr,
                            number = {
                                text: id + ".",
                                width: "5%"
                            },
                            headerText = {
                                text: gettextCatalog.getString('Vote'),
                                width: "15%"
                            },
                            /**
                             * Generates a part (consisting of different columns) of the polls
                             *
                             * Example Ja      100 ( 90% )
                             *
                             * @function
                             * @param {string} name - E.g. "Ja"
                             * @param {number} value - E.g.100
                             * @param {number} relValue - E.g. 90
                             */
                            createPart = function(name, value, relValue) {
                                var indexColumn = converter.createElement("text");
                                var nameColumn = converter.createElement("text", "" + name);
                                var valueColumn = converter.createElement("text", "" + value);
                                var relColumn = converter.createElement("text", relValue);
                                valueColumn.width = "40%";
                                indexColumn.width = "5%";
                                valueColumn.width = "5%";
                                valueColumn.alignment = "right";
                                relColumn.margin = [5, 0, 0, 0];
                                return [indexColumn, nameColumn, valueColumn, relColumn];
                            },
                            yesPart = converter.createElement("columns", createPart(gettextCatalog.getString("Yes"), yes, yesRelative)),
                            noPart = converter.createElement("columns", createPart(gettextCatalog.getString("No"), no, noRelative)),
                            abstainPart = converter.createElement("columns", createPart(gettextCatalog.getString("Abstain"), abstain, abstainRelative)),
                            totalPart = converter.createElement("columns", createPart(gettextCatalog.getString("Valid votes"), valid, validRelative)),
                            heading = converter.createElement("columns", [number, headerText]),
                            pollResult = converter.createElement("stack", [
                                heading, yesPart, noPart, abstainPart, totalPart
                            ]);

                        return pollResult;
                    }, {});
                };
            pollLabel.width = '35%';
            pollLabel.bold = true;
            var result = converter.createElement("columns", [pollLabel, results()]);
            result.margin = [10, 0, 0, 10];
            result.lineHeight = 1;
            return result;
        };

        // Generates title section for motion
        var titleSection = function() {
            var title = converter.createElement("text", motion.getTitle($scope.version));
            title.bold = true;
            title.fontSize = 14;
            title.margin = [0, 0, 0, 10];
            return title;
        };

        // Generates reason section for polls
        var reason = function() {
            var r = converter.createElement("text", gettextCatalog.getString("Reason") + ":");
            r.bold = true;
            r.fontSize = 14;
            r.margin = [0, 30, 0, 10];
            return r;
        };

        //getters
        var getTitle = function() {
            return motion.getTitle($scope.verion);
        };

        var getIdentifier = function() {
            return motion.identifier;
        };

        var getCategory = function() {
            return motion.category;
        };

        // Generates content as a pdfmake consumable
        var getContent = function() {
            if (reasonContent().length === 0 ) {
                return [
                    motionHeader(),
                    signment(),
                    polls(),
                    titleSection(),
                    textContent(),
                ];
            } else {
                return [
                    motionHeader(),
                    signment(),
                    polls(),
                    titleSection(),
                    textContent(),
                    reason(),
                    reasonContent()
                ];
            }
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

.factory('PollContentProvider', function() {
    /**
    * Generates a content provider for polls
    * @constructor
    * @param {string} title - title of poll
    * @param {string} id - if of poll
    * @param {object} gettextCatalog - for translation
    */
    var createInstance = function(title, id, gettextCatalog){

        //left and top margin for a single sheet
        var space = {
            left: 30,
            top: 30,
            bottom: 10
        },
            //size and position of the signing circle
            circle = {
            yDistance: 6,
            size: 8
        },
            //margin for the decision
            singleItemMargin = 10,
            //space between circle and dicision
            columnwidth = 20,
            //defines the space under a single sheet
            sheetend = 65,
            //defines the used fontsize
            fontSize = 14;

        /**
        * draws a single circle
        * @function
        * @param {int} y - the relative y coordinate
        * @param {int} size - size of the circle in px
        */
        var drawCircle = function(y, size) {
            return [
                {
                    type: 'ellipse',
                    x: 0,
                    y: y,
                    lineColor: 'black',
                    r1: size,
                    r2: size
                }
            ];
        };

        /**
        * Returns an entry in the ballot with a circle to draw into
        * @function
        * @param {string} decision - the name of an entry to decide between, e.g. 'yes' or 'no'
        */
        var createBallotEntry = function(decision) {
            return {
                margin: [space.left+circle.size, singleItemMargin, 0, 0],
                columns: [
                    {
                        width: columnwidth,
                        canvas: drawCircle(circle.yDistance, circle.size)
                    },
                    {
                        text: decision
                    }
                ],
            };
        };

        /**
        * Returns a single section on the ballot paper
        * @function
        */
        var createSection = function() {
            return {
                stack: [{
                    text: gettextCatalog.getString("Motion") + " " + id,
                    style: 'header',
                    margin: [space.left, space.top, 0, 0]
                }, {
                    text: title,
                    margin: [space.left, 0, 0, space.bottom]
                },
                createBallotEntry(gettextCatalog.getString("Yes")),
                createBallotEntry(gettextCatalog.getString("No")),
                createBallotEntry(gettextCatalog.getString("Abstain")),
                ],
                margin: [0, 0, 0, sheetend]
            };
        };

        /**
        * Returns Content for single motion
        * @function
        * @param {string} id - if of poll
        */
        return {
            content: [{
                table: {
                    headerRows: 1,
                    widths: ['*', '*'],
                    body: [
                        [createSection(), createSection()],
                        [createSection(), createSection()],
                        [createSection(), createSection()],
                        [createSection(), createSection()]
                    ],
                },
                layout: {
                    hLineWidth: function() {return 0.5;},
                    vLineWidth: function() {return 0.5;},
                    hLineColor: function() {return 'gray';},
                    vLineColor: function() {return 'gray';},
                }
            }],
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0],
            styles: {
                header: {
                    fontSize: fontSize,
                    bold: true
                }
            },
        };
    };
    return {
        createInstance: createInstance
    };
})

.factory('MotionCatalogContentProvider', ['gettextCatalog', function(gettextCatalog) {

    /**
    * Constructor
    * @function
    * @param {object} allMotions - A sorted array of all motions to parse
    * @param {object} $scope - Current $scope
    * @param {object} User - Current user
    */
    var createInstance = function(allMotions, $scope, User, Category) {

        //function to create the Table of contents
        var createTitle = function() {

            return {
                text: gettextCatalog.getString("Motions"),
                style: "title"
            };
        };

        var createTOContent = function(motionTitles) {

            var heading = {
                text: gettextCatalog.getString("Table of contents"),
                style: "heading",
            };

            var toc = [];
            angular.forEach(motionTitles, function(title) {
                toc.push({
                    text: gettextCatalog.getString("Motion") + " " + title,
                    style: "tableofcontent",
                });
            });

            return [
                heading,
                toc,
                addPageBreak()
            ];
        };

        // function to create the table of catergories (if any)
        var createTOCatergories = function() {
            if (Category.getAll().length > 0) {
                var heading = {
                    text: gettextCatalog.getString("Categories"),
                    style: "heading"
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
                    addPageBreak()
                ];
            } else {
                // if there are no categories, return "empty string"
                // pdfmake takes "null" literally and throws an error
                return "";
            }
        };

        // function to apply a pagebreak-keyword
        var addPageBreak = function() {
            return [
                {
                    text: '',
                    pageBreak: 'after'
                }
            ];
        };

        // returns the pure content of the motion, parseable by makepdf
        var getContent = function() {
            var motionContent = [];
            var motionTitles = [];
            var motionCategories = [];
            angular.forEach(allMotions, function(motion, key) {
                motionTitles.push(motion.getIdentifier() + ": " + motion.getTitle());
                motionContent.push(motion.getContent());
                if (key < allMotions.length - 1) {
                    motionContent.push(addPageBreak());
                }
            });

            return [
                createTitle(),
                createTOCatergories(),
                createTOContent(motionTitles),
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
