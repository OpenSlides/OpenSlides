import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HtmlToPdfService } from 'app/core/pdf-services/html-to-pdf.service';
import { PollVoteValue } from 'app/core/ui-services/poll.service';
import { AssignmentPollService } from './assignment-poll.service';
import { ViewAssignment } from '../models/view-assignment';
import { ViewAssignmentPoll } from '../models/view-assignment-poll';
import { ViewAssignmentPollOption } from '../models/view-assignment-poll-option';

/**
 * Creates a PDF document from a single assignment
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentPdfService {
    /**
     * Will be set to `true` of a person was elected.
     * Determines that in indicator is shown under the table
     */
    private showIsElected = false;

    /**
     * Constructor
     *
     * @param translate Translate
     * @param pollService Get poll information
     * @param pdfDocumentService PDF functions
     * @param htmlToPdfService Convert the assignment detail html text to pdf
     */
    public constructor(
        private translate: TranslateService,
        private pollService: AssignmentPollService,
        private htmlToPdfService: HtmlToPdfService
    ) {}

    /**
     * Main function to control the pdf generation.
     * Calls all other functions to generate the PDF in multiple steps
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns a pdfmake compatible document as document
     */
    public assignmentToDocDef(assignment: ViewAssignment): object {
        const title = this.createTitle(assignment);
        const preamble = this.createPreamble(assignment);
        const description = this.createDescription(assignment);
        const candidateList = this.createCandidateList(assignment);
        const pollResult = this.createPollResultTable(assignment);

        return [title, preamble, description, candidateList, pollResult];
    }

    /**
     * Creates the title for PDF
     * TODO: Cleanup. Should be reused from time to time. Can be in another service
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns the title part of the document
     */
    private createTitle(assignment: ViewAssignment): object {
        return {
            text: assignment.title,
            style: 'title'
        };
    }

    /**
     * Creates the preamble, usually just contains "Number of persons to be elected"
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns the preamble part of the pdf document
     */
    private createPreamble(assignment: ViewAssignment): object {
        const preambleText = `${this.translate.instant('Number of persons to be elected')}: `;
        const memberNumber = '' + assignment.open_posts;
        const preamble = {
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
    }

    /**
     * Creates the  description part of the document. Also converts the parts of an assignment to PDF
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns the description of the assignment
     */
    private createDescription(assignment: ViewAssignment): object {
        if (assignment.description) {
            const descriptionDocDef = this.htmlToPdfService.addPlainText(assignment.description);

            const descriptionText = `${this.translate.instant('Description')}: `;
            const description = [
                {
                    text: descriptionText,
                    bold: true,
                    style: 'textItem'
                },
                descriptionDocDef
            ];
            return description;
        } else {
            return {};
        }
    }

    /**
     * Creates the assignment list
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns the assignment list as PDF document
     */
    private createCandidateList(assignment: ViewAssignment): object {
        if (assignment.phase !== 2) {
            const candidates = assignment.assignment_related_users.sort((a, b) => a.weight - b.weight);

            const candidatesText = `${this.translate.instant('Candidates')}: `;
            const userList = candidates.map(candidate => {
                return {
                    text: candidate.user.full_name,
                    margin: [0, 0, 0, 10]
                };
            });

            return {
                columns: [
                    {
                        text: candidatesText,
                        bold: true,
                        width: '25%',
                        style: 'textItem'
                    },
                    {
                        ul: userList,
                        style: 'textItem'
                    }
                ]
            };
        } else {
            return {};
        }
    }

    /**
     * Creates a candidate line in the results table
     *
     * @param candidateName The name of the candidate
     * @param pollOption the poll options (yes, no, maybe [...])
     * @returns a line in the table
     */
    private electedCandidateLine(candidateName: string, pollOption: ViewAssignmentPollOption): object {
        if (pollOption.is_elected) {
            this.showIsElected = true;
            return {
                text: candidateName + '*',
                bold: true
            };
        } else {
            return {
                text: candidateName
            };
        }
    }

    /**
     * Creates the poll result table for all published polls
     *
     * @param assignment the ViewAssignment to create the document for
     * @returns the table as pdfmake object
     */
    private createPollResultTable(assignment: ViewAssignment): object {
        const resultBody = [];
        for (let pollIndex = 0; pollIndex < assignment.polls.length; pollIndex++) {
            const poll = assignment.polls[pollIndex];
            if (poll.published) {
                const pollTableBody = [];

                resultBody.push({
                    text: `${this.translate.instant('Ballot')} ${pollIndex + 1}`,
                    bold: true,
                    style: 'textItem',
                    margin: [0, 15, 0, 0]
                });

                pollTableBody.push([
                    {
                        text: this.translate.instant('Candidates'),
                        style: 'tableHeader'
                    },
                    {
                        text: this.translate.instant('Votes'),
                        style: 'tableHeader'
                    }
                ]);

                for (let optionIndex = 0; optionIndex < poll.options.length; optionIndex++) {
                    const pollOption = poll.options[optionIndex];

                    const candidateName = pollOption.user.full_name;
                    const votes = pollOption.votes; // 0 = yes, 1 = no, 2 = abstain0 = yes, 1 = no, 2 = abstain
                    const tableLine = [];
                    tableLine.push(this.electedCandidateLine(candidateName, pollOption));

                    if (poll.pollmethod === 'votes') {
                        tableLine.push({
                            text: this.parseVoteValue(votes[0].value, votes[0].weight, poll, pollOption)
                        });
                    } else {
                        const resultBlock = votes.map(vote =>
                            this.parseVoteValue(vote.value, vote.weight, poll, pollOption)
                        );

                        tableLine.push({
                            text: resultBlock
                        });
                    }
                    pollTableBody.push(tableLine);
                }

                // push the result lines
                const summaryLine = this.pollService.getVoteOptionsByPoll(poll).map(key => {
                    // TODO: Refractor into pollService to make this easier.
                    //       Return an object with untranslated lable: string, specialLabel: string and (opt) percent: number
                    const conclusionLabel = this.translate.instant(this.pollService.getLabel(key));
                    const specialLabel = this.translate.instant(this.pollService.getSpecialLabel(poll[key]));
                    let percentLabel = '';
                    if (!this.pollService.isAbstractValue(this.pollService.calculationDataFromPoll(poll), key)) {
                        percentLabel = ` (${this.pollService.getValuePercent(
                            this.pollService.calculationDataFromPoll(poll),
                            key
                        )}%)`;
                    }
                    return [
                        {
                            text: conclusionLabel,
                            style: 'tableConclude'
                        },
                        {
                            text: specialLabel + percentLabel,
                            style: 'tableConclude'
                        }
                    ];
                });

                pollTableBody.push(...summaryLine);

                resultBody.push({
                    table: {
                        widths: ['64%', '33%'],
                        headerRows: 1,
                        body: pollTableBody
                    },
                    layout: 'switchColorTableLayout'
                });
            }
        }

        // add the legend to the result body
        // if (assignment.polls.length > 0 && isElectedSemaphore) {
        if (assignment.polls.length > 0 && this.showIsElected) {
            resultBody.push({
                text: `* = ${this.translate.instant('is elected')}`,
                margin: [0, 5, 0, 0]
            });
        }

        return resultBody;
    }

    /**
     * Creates a translated voting result with numbers and percent-value depending in the polloptions
     * I.e: "Yes 25 (22,2%)" or just "10"
     *
     * @param optionLabel Usually Yes or No
     * @param value the amount of votes
     * @param poll the specific poll
     * @param pollOption the corresponding poll option
     * @returns a string a nicer number representation: "Yes 25 (22,2%)" or just "10"
     */
    private parseVoteValue(
        optionLabel: PollVoteValue,
        value: number,
        poll: ViewAssignmentPoll,
        pollOption: ViewAssignmentPollOption
    ): string {
        let resultString = '';
        const label = this.translate.instant(this.pollService.getLabel(optionLabel));
        const valueString = this.pollService.getSpecialLabel(value);
        const percentNr = this.pollService.getPercent(
            this.pollService.calculationDataFromPoll(poll),
            pollOption,
            optionLabel
        );

        resultString += `${label} ${valueString}`;
        if (
            percentNr &&
            !this.pollService.isAbstractOption(this.pollService.calculationDataFromPoll(poll), pollOption, optionLabel)
        ) {
            resultString += ` (${percentNr}%)`;
        }

        return `${resultString}\n`;
    }
}
