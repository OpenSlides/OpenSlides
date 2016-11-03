(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.pdf', ['OpenSlidesApp.core.pdf'])

.factory('AssignmentContentProvider', [
    'gettextCatalog',
    'PdfPredefinedFunctions',
    function(gettextCatalog, PdfPredefinedFunctions) {

        var createInstance = function(assignment) {

            //use the Predefined Functions to create the title
            var title = PdfPredefinedFunctions.createTitle(
                gettextCatalog.getString("Election") + ": " + assignment.title);

            //create the preamble
            var createPreamble = function() {
                var preambleText = gettextCatalog.getString("Number of posts to be elected") + ": ";
                var memberNumber = ""+assignment.open_posts;
                var preamble = {
                    text: [
                        {
                            text: preambleText,
                            bold: true,
                            style: 'textItem'
                        },
                        {
                            text: memberNumber,
                            style: 'textItem'
                        }
                    ]
                };
                return preamble;
            };

            //adds the description if present in the assignment
            var createDescription = function() {
                if (assignment.description) {
                    var descriptionText = gettextCatalog.getString("Description") + ":";
                    var description = [
                        {
                            text: descriptionText,
                            bold: true,
                            style: 'textItem'
                        },
                        {
                            text: assignment.description,
                            style: 'textItem',
                            margin: [10, 0, 0, 0]
                        }
                    ];
                    return description;
                } else {
                    return "";
                }
            };

            //creates the candidate list in columns if the assignment phase is 'voting'
            var createCandidateList = function() {
                if (assignment.phase != 2) {
                    var candidatesText = gettextCatalog.getString("Candidates") + ": ";
                    var userList = [];

                    angular.forEach(assignment.assignment_related_users, function(assignmentsRelatedUser) {
                        userList.push({
                                text: assignmentsRelatedUser.user.get_full_name(),
                                margin: [0, 0, 0, 10],
                            }
                        );
                    });

                    var cadidateList = {
                        columns: [
                            {
                                text: candidatesText,
                                bold: true,
                                width: "25%",
                                style: 'textItem'
                            },
                            {
                                ol: userList,
                                style: 'textItem'
                            }
                        ]
                    };
                    return cadidateList;
                } else {
                    return "";
                }
            };

            //handles the case if a candidate is elected or not
            var electedCandidateLine = function(candidateName, pollOption, pollTableBody) {
                if (pollOption.is_elected) {
                    return {
                        text: candidateName + "*",
                        bold: true,
                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                    };
                } else {
                    return {
                        text: candidateName,
                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                    };
                }
            };

            //creates the pull result table
            var createPollResultTable = function() {
                var resultBody = [];
                angular.forEach(assignment.polls, function(poll, pollIndex) {
                    if (poll.published) {
                        var voteNrTotal = poll.votescast;
                        var voteNrValid = poll.votesvalid;
                        var voteNrInVal = poll.votesinvalid;
                        var pollTableBody = [];

                        resultBody.push({
                            text: gettextCatalog.getString("Ballot") + " " + (pollIndex+1),
                            bold: true,
                            style: 'textItem',
                            margin: [0,15,0,0]
                        });

                        pollTableBody.push([
                            {
                                text: gettextCatalog.getString("Candidates"),
                                style: 'tableHeader',
                            },
                            {
                                text: gettextCatalog.getString("Votes"),
                                style: 'tableHeader',
                            }
                        ]);

                        angular.forEach(poll.options, function(pollOption, optionIndex) {
                            var candidateName = pollOption.candidate.get_full_name();
                            var votes = pollOption.getVotes(); // 0 = yes, 1 = no, 2 = abstain
                            var candidateLine;

                            if (poll.pollmethod == 'votes') {
                                pollTableBody.push([
                                    electedCandidateLine(candidateName, pollOption, pollTableBody),
                                    {
                                        text: votes[0].value + " " + votes[0].percentStr,
                                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                                    }
                                ]);
                            } else if (poll.pollmethod == 'yn') {
                                pollTableBody.push([
                                    {
                                        text: candidateName,
                                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                                    },
                                    {
                                        text: [
                                            {
                                                text: votes[0].label + ": " +  votes[0].value + " " + votes[0].percentStr + "\n"
                                            },
                                            {
                                                text: votes[1].label + ": " +  votes[1].value + " " + votes[1].percentStr
                                            }
                                        ],
                                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                                    }
                                ]);
                            } else if (poll.pollmethod == 'yna') {
                                pollTableBody.push([
                                    {
                                        text: candidateName,
                                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                                    },
                                    {
                                        text: [
                                            {
                                                text: votes[0].label + ": " +  votes[0].value + " " + votes[0].percentStr + "\n"
                                            },
                                            {
                                                text: votes[1].label + ": " +  votes[1].value + " " + votes[1].percentStr + "\n"
                                            },
                                            {
                                                text: votes[2].label + ": " +  votes[2].value + " " + votes[2].percentStr
                                            }
                                        ],
                                        style: PdfPredefinedFunctions.flipTableRowStyle(pollTableBody.length)
                                    }
                                ]);
                            }
                        });

                        //it is technically possible to make a single push-statement
                        //however, the flipTableRowStyle-function needs the current table size
                        if (voteNrValid) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Valid ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: ""+voteNrValid,
                                    style: 'tableConclude'
                                },
                            ]);
                        }

                        if (voteNrInVal) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Invalid ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: ""+voteNrInVal,
                                    style: 'tableConclude'
                                },
                            ]);
                        }

                        if (voteNrTotal) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Casted ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: ""+voteNrTotal,
                                    style: 'tableConclude'
                                },
                            ]);
                        }

                        var resultTableJsonSting = {
                            table: {
                                widths: ['64%','33%'],
                                headerRows: 1,
                                body: pollTableBody,
                            },
                            layout: 'headerLineOnly',
                        };

                        resultBody.push(resultTableJsonSting);
                    }
                });

                //Add the Legend to the result body
                resultBody.push({
                    text: "* = " + gettextCatalog.getString("is elected"),
                    margin: [0,5,0,0],
                });

                return resultBody;
            };

            var getTitle = function() {
                return assignment.title;
            };

            var getContent = function() {
                return [
                    title,
                    createPreamble(),
                    createDescription(),
                    createCandidateList(),
                    createPollResultTable()
                ];
            };

            return {
                getContent: getContent,
                getTitle: getTitle
            };
        };

    return {
        createInstance: createInstance
    };
}])

.factory('BallotContentProvider', [
    'gettextCatalog',
    'PdfPredefinedFunctions',
    function(gettextCatalog, PdfPredefinedFunctions) {

        var createInstance = function(scope, poll, pollNumber) {

            // use the Predefined Functions to create the title
            var createTitle = function() {
                return {
                    text: gettextCatalog.getString("Election") + ": " + scope.assignment.title,
                    style: 'title',
                };
            };

            //function to create the poll hint
            var createPollHint = function() {
                return {
                    text: gettextCatalog.getString("Ballot") + " " + pollNumber + ": " + poll.description,
                    style: 'description',
                };
            };

            //function to create the selection entries
            var createYNBallotEntry = function(decision) {
                var YNColumn = [
                    {
                        width: "auto",
                        stack: [
                            PdfPredefinedFunctions.createBallotEntry(gettextCatalog.getString("Yes"))
                        ]
                    },
                    {
                        width: "auto",
                        stack: [
                            PdfPredefinedFunctions.createBallotEntry(gettextCatalog.getString("No"))
                        ]
                    },
                ];

                if (poll.pollmethod == 'yna') {
                    YNColumn.push({
                        width: "auto",
                        stack: [
                            PdfPredefinedFunctions.createBallotEntry(gettextCatalog.getString("Abstain"))
                        ]
                    });
                }

                return [
                    {
                        text: decision,
                        margin: [40, 10, 0, 0],
                    },
                    {
                        columns: YNColumn
                    }
                ];
            };

            var createSelectionField = function() {
                var candidateBallotList = [];

                if (poll.pollmethod == 'votes') {
                    angular.forEach(poll.options, function(option) {
                        var candidate = option.candidate.get_full_name();
                        candidateBallotList.push(PdfPredefinedFunctions.createBallotEntry(candidate));
                    });
                } else {
                    angular.forEach(poll.options, function(option) {
                        var candidate = option.candidate.get_full_name();
                        candidateBallotList.push(createYNBallotEntry(candidate));
                    });
                }
                return candidateBallotList;
            };

            var createSection = function(marginTop) {

                // since it is not possible to give a column a fixed height, we draw an "empty" column
                // with a one px width and a fixed top-margin

                return {
                    columns : [
                        {
                            width: 1,
                            margin: [0,marginTop],
                            text: ""
                        },
                        {
                            width: '*',
                            stack: [
                                createTitle(),
                                createPollHint(),
                                createSelectionField(),
                            ]
                        }
                    ]
                };
            };

            var createTableBody = function(numberOfRows, sheetend) {
                var tableBody = [];
                for (var i = 0; i < numberOfRows; i++) {
                    tableBody.push([createSection(sheetend), createSection(sheetend)]);
                }
                return tableBody;
            };

            var createContentTable = function() {

                var tableBody = [];
                var sheetend;

                if (poll.pollmethod == 'votes') {
                    if (poll.options.length <= 4) {
                        sheetend = 105;
                        tableBody = createTableBody(4, sheetend);
                    } else if (poll.options.length <= 8) {
                        sheetend = 140;
                        tableBody = tableBody = createTableBody(3, sheetend);
                    } else if (poll.options.length <= 12) {
                        sheetend = 210;
                        tableBody = tableBody = createTableBody(2, sheetend);
                    }
                    else { //works untill ~30 people
                        sheetend = 418;
                        tableBody = createTableBody(1, sheetend);
                    }
                } else {
                    if (poll.options.length <= 2) {
                        sheetend = 105;
                        tableBody = createTableBody(4, sheetend);
                    } else if (poll.options.length <= 4) {
                        sheetend = 140;
                        tableBody = createTableBody(3, sheetend);
                    } else if (poll.options.length <= 6) {
                        sheetend = 210;
                        tableBody = createTableBody(2, sheetend);
                    } else {
                        sheetend = 418;
                        tableBody = createTableBody(1, sheetend);
                    }
                }

                return [{
                    table: {
                        headerRows: 1,
                        widths: ['50%', '50%'],
                        body: tableBody
                    },
                    layout: PdfPredefinedFunctions.getBallotLayoutLines()
                }];
            };

            var getContent = function() {
                return createContentTable();
            };

            return {
                getContent: getContent
            };
        };

    return {
        createInstance: createInstance
    };
}])

.factory('AssignmentCatalogContentProvider', [
    'gettextCatalog',
    'PdfPredefinedFunctions',
    function(gettextCatalog, PdfPredefinedFunctions) {

        var createInstance = function(allAssignmnets, Config) {

            var title = PdfPredefinedFunctions.createTitle(Config.get('assignments_pdf_title').value);

            var createPreamble = function() {
                var preambleText = Config.get('assignments_pdf_preamble').value;
                if (preambleText) {
                    return {
                        text: preambleText,
                        style: "preamble"
                    };
                } else {
                    return "";
                }
            };

            var createTOContent = function(assignmentTitles) {
                var heading = {
                    text: gettextCatalog.getString("Table of contents"),
                    style: "heading",
                };

                var toc = [];
                angular.forEach(assignmentTitles, function(title, key) {
                    toc.push({
                        text: gettextCatalog.getString("Election") + " " + (key+1) + ": " + title,
                        style: "tableofcontent",
                    });
                });

                return [
                    heading,
                    toc,
                    PdfPredefinedFunctions.addPageBreak()
                ];
            };

            var getContent = function() {
                var content = [];
                var assignmentContent = [];
                var assignmentTitles = [];

                angular.forEach(allAssignmnets, function(assignment, key) {
                    assignmentTitles.push(assignment.getTitle());
                    assignmentContent.push(assignment.getContent());
                    if (key < allAssignmnets.length - 1) {
                        assignmentContent.push(PdfPredefinedFunctions.addPageBreak());
                    }
                });

                content.push(title);
                content.push(createPreamble());
                content.push(createTOContent(assignmentTitles));
                content.push(assignmentContent);
                return content;
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
