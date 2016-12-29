(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.pdf', ['OpenSlidesApp.core.pdf'])

.factory('AssignmentContentProvider', [
    '$filter',
    'gettextCatalog',
    'PDFLayout',
    function($filter, gettextCatalog, PDFLayout) {

        var createInstance = function(assignment) {

            // page title
            var title = PDFLayout.createTitle(assignment.title);
            var isElectedSemaphore = false;

            // open posts
            var createPreamble = function() {
                var preambleText = gettextCatalog.getString("Number of persons to be elected") + ": ";
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

            // description
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

            // show candidate list (if assignment phase is not 'finished')
            var createCandidateList = function() {
                if (assignment.phase != 2) {
                    var candidates = $filter('orderBy')(assignment.assignment_related_users, 'weight');
                    var candidatesText = gettextCatalog.getString("Candidates") + ": ";
                    var userList = [];

                    angular.forEach(candidates, function(assignmentsRelatedUser) {
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
                                ul: userList,
                                style: 'textItem'
                            }
                        ]
                    };
                    return cadidateList;
                } else {
                    return "";
                }
            };

            // handles the case if a candidate is elected or not
            var electedCandidateLine = function(candidateName, pollOption, pollTableBody) {
                if (pollOption.is_elected) {
                    isElectedSemaphore = true;
                    return {
                        text: candidateName + "*",
                        bold: true,
                        style: PDFLayout.flipTableRowStyle(pollTableBody.length)
                    };
                } else {
                    return {
                        text: candidateName,
                        style: PDFLayout.flipTableRowStyle(pollTableBody.length)
                    };
                }
            };

            //creates the voting string for the result table and differentiates between special values
            var parseVoteValue = function(voteObject, printLabel) {
                var voteVal = "";

                if (printLabel) {
                    voteVal += voteObject.label + ": ";
                }

                voteVal += voteObject.value;

                if (voteObject.percentStr) {
                    voteVal += " " + voteObject.percentStr;
                }

                voteVal += "\n";
                return voteVal;
            };

            // creates the election result table
            var createPollResultTable = function() {
                var resultBody = [];
                angular.forEach(assignment.polls, function(poll, pollIndex) {
                    if (poll.published) {
                        var pollTableBody = [];

                        resultBody.push({
                            text: gettextCatalog.getString("Ballot") + " " + (pollIndex+1),
                            bold: true,
                            style: 'textItem',
                            margin: [0, 15, 0, 0]
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
                            var tableLine = [];

                            tableLine.push(electedCandidateLine(candidateName, pollOption, pollTableBody));
                            if (poll.pollmethod == 'votes') {
                                tableLine.push(
                                    {
                                        text: parseVoteValue(votes[0], false),
                                        style: PDFLayout.flipTableRowStyle(pollTableBody.length)
                                    }
                                );
                            } else {
                                var resultBlock = [];
                                angular.forEach(votes, function(vote) {
                                    resultBlock.push(parseVoteValue(vote, true));
                                });
                                tableLine.push({
                                        text: resultBlock,
                                        style: PDFLayout.flipTableRowStyle(pollTableBody.length)
                                    }
                                );
                            }
                            pollTableBody.push(tableLine);
                        });

                        if (poll.votesvalid) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Valid ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: parseVoteValue(poll.getVote('votesvalid'), false),
                                    style: 'tableConclude'
                                },
                            ]);
                        }

                        if (poll.votesinvalid) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Invalid ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: parseVoteValue(poll.getVote('votesinvalid'), false),
                                    style: 'tableConclude'
                                },
                            ]);
                        }

                        if (poll.votescast) {
                            pollTableBody.push([
                                {
                                    text: gettextCatalog.getString("Casted ballots"),
                                    style: 'tableConclude'
                                },
                                {
                                    text: parseVoteValue(poll.getVote('votescast'), false),
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

                // add the legend to the result body
                if (assignment.polls.length > 0 && isElectedSemaphore) {
                    resultBody.push({
                        text: "* = " + gettextCatalog.getString("is elected"),
                        margin: [0, 5, 0, 0],
                    });
                }

                return resultBody;
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
                title: assignment.title
            };
        };

    return {
        createInstance: createInstance
    };
}])

.factory('BallotContentProvider', [
    '$filter',
    'gettextCatalog',
    'PDFLayout',
    'Config',
    'User',
    function($filter, gettextCatalog, PDFLayout, Config, User) {
        var createInstance = function(scope, poll, pollNumber) {

            // page title
            var createTitle = function() {
                return {
                    text: scope.assignment.title,
                    style: 'title',
                };
            };

            // poll description
            var createPollHint = function() {
                var description = poll.description ? ': ' + poll.description : '';
                return {
                    text: gettextCatalog.getString("Ballot") + " " + pollNumber + description,
                    style: 'description',
                };
            };

            // election entries
            var createYNBallotEntry = function(decision) {
                var YNColumn = [
                    {
                        width: "auto",
                        stack: [
                            PDFLayout.createBallotEntry(gettextCatalog.getString("Yes"))
                        ]
                    },
                    {
                        width: "auto",
                        stack: [
                            PDFLayout.createBallotEntry(gettextCatalog.getString("No"))
                        ]
                    },
                ];

                if (poll.pollmethod == 'yna') {
                    YNColumn.push({
                        width: "auto",
                        stack: [
                            PDFLayout.createBallotEntry(gettextCatalog.getString("Abstain"))
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
                var candidates = $filter('orderBy')(poll.options, 'weight');
                var candidateBallotList = [];

                if (poll.pollmethod == 'votes') {
                    angular.forEach(candidates, function(option) {
                        var candidate = option.candidate.get_full_name();
                        candidateBallotList.push(PDFLayout.createBallotEntry(candidate));
                    });
                } else {
                    angular.forEach(candidates, function(option) {
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
                            margin: [0, marginTop],
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

            var createTableBody = function(numberOfRows, sheetend, maxballots) {
                var ballotstoprint = numberOfRows * 2;
                if (Number.isInteger(maxballots) && maxballots > 0 && maxballots < ballotstoprint) {
                    ballotstoprint = maxballots;
                }
                var tableBody = [];
                while (ballotstoprint > 1){
                    tableBody.push([createSection(sheetend), createSection(sheetend)]);
                    ballotstoprint -= 2;
                }
                if (ballotstoprint == 1) {
                    tableBody.push([createSection(sheetend), '']);
                }
                return tableBody;
            };

            var createContentTable = function() {
                // first, determine how many ballots we need
                var amount;
                var amount_method = Config.get('assignments_pdf_ballot_papers_selection').value;
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
                        amount = Config.get('assignments_pdf_ballot_papers_number').value;
                        break;
                    default:
                        // should not happen.
                        amount = 0;
                }
                var tabledContent = [];
                var rowsperpage;
                var sheetend;
                if (poll.pollmethod == 'votes') {
                    if (poll.options.length <= 4) {
                        sheetend = 105;
                        rowsperpage = 4;
                    } else if (poll.options.length <= 8) {
                        sheetend = 140;
                        rowsperpage = 3;
                    } else if (poll.options.length <= 12) {
                        sheetend = 210;
                        rowsperpage = 2;
                    }
                    else { //works untill ~30 people
                        sheetend = 418;
                        rowsperpage = 1;
                    }
                } else {
                    if (poll.options.length <= 2) {
                        sheetend = 105;
                        rowsperpage = 4;
                    } else if (poll.options.length <= 4) {
                        sheetend = 140;
                        rowsperpage = 3;
                    } else if (poll.options.length <= 6) {
                        sheetend = 210;
                        rowsperpage = 2;
                    } else {
                        sheetend = 418;
                        rowsperpage = 1;
                    }
                }
                var page_entries = rowsperpage * 2;
                var fullpages = Math.floor(amount / page_entries);
                for (var i=0; i < fullpages; i++) {
                    tabledContent.push({
                        table: {
                            headerRows: 1,
                            widths: ['50%', '50%'],
                            body: createTableBody(rowsperpage, sheetend),
                            pageBreak: 'after'
                            },
                            layout: PDFLayout.getBallotLayoutLines(),
                            rowsperpage: rowsperpage
                        });
                }
                // fill the last page only partially
                var lastpage_ballots = amount - (fullpages * page_entries);
                if (lastpage_ballots < page_entries && lastpage_ballots > 0){
                    var partialpage = createTableBody(rowsperpage, sheetend, lastpage_ballots);
                    tabledContent.push({
                        table: {
                            headerRows: 1,
                            widths: ['50%', '50%'],
                            body: partialpage
                        },
                        layout: PDFLayout.getBallotLayoutLines(),
                        rowsperpage: rowsperpage
                    });
                }
                return tabledContent;
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
    'PDFLayout',
    'Config',
    function(gettextCatalog, PDFLayout, Config) {

        var createInstance = function(allAssignmnets) {

            var title = PDFLayout.createTitle(
                    Config.translate(Config.get('assignments_pdf_title').value)
            );

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
                    style: "heading2",
                };

                var toc = [];
                angular.forEach(assignmentTitles, function(title) {
                    toc.push({
                        text: title,
                        style: "tableofcontent"
                    });
                });

                return [
                    heading,
                    toc,
                    PDFLayout.addPageBreak()
                ];
            };

            var getContent = function() {
                var content = [];
                var assignmentContent = [];
                var assignmentTitles = [];

                angular.forEach(allAssignmnets, function(assignment, key) {
                    assignmentTitles.push(assignment.title);
                    assignmentContent.push(assignment.getContent());
                    if (key < allAssignmnets.length - 1) {
                        assignmentContent.push(PDFLayout.addPageBreak());
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
