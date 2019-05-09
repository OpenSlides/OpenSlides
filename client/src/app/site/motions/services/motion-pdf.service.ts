import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { CalculablePollKey } from 'app/core/ui-services/poll.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { getRecommendationTypeName } from 'app/shared/utils/recommendation-type-names';
import { HtmlToPdfService } from 'app/core/ui-services/html-to-pdf.service';
import { MotionPollService } from './motion-poll.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { PdfDocumentService } from 'app/core/ui-services/pdf-document.service';
import { ViewMotionAmendedParagraph } from '../models/view-motion-amended-paragraph';
import { ViewMotionChangeRecommendation } from '../models/view-motion-change-recommendation';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';

/**
 * Type declaring which strings are valid options for metainfos to be exported into a pdf
 */
export type InfoToExport =
    | 'submitters'
    | 'state'
    | 'recommendation'
    | 'category'
    | 'motion_block'
    | 'origin'
    | 'tags'
    | 'polls'
    | 'id'
    | 'allcomments';

/**
 * Converts a motion to pdf. Can be used from the motion detail view or executed on a list of motions
 * Provides the public method `motionToDocDef(motion: Motion)` which should be convenient to use.
 * `motionToDocDef(... )` accepts line numbering mode and change recommendation mode as optional parameter.
 * If not present, the default parameters will be read from the config.
 *
 * @example
 * ```ts
 * const pdfMakeCompatibleDocDef = this.MotionPdfService.motionToDocDef(myMotion);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPdfService {
    /**
     * Get the {@link getRecommendationTypeName}-Function from Utils
     */
    public getRecommendationTypeName = getRecommendationTypeName;

    /**
     * Constructor
     *
     * @param translate handle translations
     * @param motionRepo get parent motions
     * @param statuteRepo To get formated stature paragraphs
     * @param changeRecoRepo to get the change recommendations
     * @param configService Read config variables
     * @param pdfDocumentService Global PDF Functions
     * @param htmlToPdfService To convert HTML text into pdfmake doc def
     * @param pollService MotionPollService for rendering the polls
     * @param linenumberingService Line numbers
     * @param commentRepo MotionCommentSectionRepositoryService to print comments
     */
    public constructor(
        private translate: TranslateService,
        private motionRepo: MotionRepositoryService,
        private statuteRepo: StatuteParagraphRepositoryService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private configService: ConfigService,
        private pdfDocumentService: PdfDocumentService,
        private htmlToPdfService: HtmlToPdfService,
        private pollService: MotionPollService,
        private linenumberingService: LinenumberingService,
        private commentRepo: MotionCommentSectionRepositoryService
    ) {}

    /**
     * Converts a motion to PdfMake doc definition
     *
     * @param motion the motion to convert to pdf
     * @param lnMode determine the used line mode
     * @param crMode determine the used change Recommendation mode
     * @param contentToExport determine which content is to export. If left out, everything will be exported
     * @param infoToExport determine which metaInfo to export. If left out, everything will be exported.
     * @param commentsToExport comments to chose for export. If 'allcomments' is set in infoToExport, this selection will be ignored and all comments exported
     * @returns doc def for the motion
     */
    public motionToDocDef(
        motion: ViewMotion,
        lnMode?: LineNumberingMode,
        crMode?: ChangeRecoMode,
        contentToExport?: string[],
        infoToExport?: InfoToExport[],
        commentsToExport?: number[]
    ): object {
        // get the line length from the config
        const lineLength = this.configService.instant<number>('motions_line_length');
        let motionPdfContent = [];

        // Enforces that statutes should always have Diff Mode and no line numbers
        if (motion.isStatuteAmendment()) {
            lnMode = LineNumberingMode.None;
            crMode = ChangeRecoMode.Diff;
        }

        // determine the default lnMode if not explicitly given
        if (!lnMode) {
            lnMode = this.configService.instant('motions_default_line_numbering');
        }

        // determine the default crMode if not explicitly given
        if (!crMode) {
            crMode = this.configService.instant('motions_recommendation_text_mode');
        }

        const title = this.createTitle(motion);
        const sequential = !infoToExport || infoToExport.includes('id');
        const subtitle = this.createSubtitle(motion, sequential);

        motionPdfContent = [title, subtitle];

        if ((infoToExport && infoToExport.length > 0) || !infoToExport) {
            const metaInfo = this.createMetaInfoTable(motion, lineLength, crMode, infoToExport);
            motionPdfContent.push(metaInfo);
        }

        if (!contentToExport || contentToExport.includes('text')) {
            const preamble = this.createPreamble(motion);
            motionPdfContent.push(preamble);
            const text = this.createText(motion, lineLength, lnMode, crMode);
            motionPdfContent.push(text);
        }

        if (!contentToExport || contentToExport.includes('reason')) {
            const reason = this.createReason(motion, lnMode);
            motionPdfContent.push(reason);
        }

        if (infoToExport && infoToExport.includes('allcomments')) {
            commentsToExport = this.commentRepo.getSortedViewModelList().map(vm => vm.id);
        }
        if (commentsToExport) {
            motionPdfContent.push(this.createComments(motion, commentsToExport));
        }

        return motionPdfContent;
    }

    /**
     * Create the motion title part of the doc definition
     *
     * @param motion the target motion
     * @returns doc def for the document title
     */
    private createTitle(motion: ViewMotion): object {
        const identifier = motion.identifier ? ' ' + motion.identifier : '';
        const title = `${this.translate.instant('Motion')} ${identifier}: ${motion.title}`;

        return {
            text: title,
            style: 'title'
        };
    }

    /**
     * Create the motion subtitle and sequential number part of the doc definition
     *
     * @param motion the target motion
     * @param sequential set to true to include the sequential number
     * @returns doc def for the subtitle
     */
    private createSubtitle(motion: ViewMotion, sequential?: boolean): object {
        const subtitleLines = [];
        if (sequential) {
            subtitleLines.push(`${this.translate.instant('Sequential number')}: ${motion.id}`);
        }

        if (motion.parent_id) {
            if (sequential) {
                subtitleLines.push(' • ');
            }
            subtitleLines.push(
                `${this.translate.instant('Amendment to')} ${motion.parent.identifier || motion.parent.title}`
            );
        }

        return {
            text: subtitleLines,
            style: 'subtitle'
        };
    }

    /**
     * Creates the MetaInfoTable
     *
     * @param motion the target motion
     * @returns doc def for the meta infos
     */
    private createMetaInfoTable(
        motion: ViewMotion,
        lineLength: number,
        crMode: ChangeRecoMode,
        infoToExport?: InfoToExport[]
    ): object {
        const metaTableBody = [];

        // submitters
        if (!infoToExport || infoToExport.includes('submitters')) {
            const submitters = motion.submitters
                .map(submitter => {
                    return submitter.full_name;
                })
                .join(', ');

            metaTableBody.push([
                {
                    text: `${this.translate.instant('Submitters')}:`,
                    style: 'boldText'
                },
                {
                    text: submitters
                }
            ]);
        }

        // state
        if (!infoToExport || infoToExport.includes('state')) {
            metaTableBody.push([
                {
                    text: `${this.translate.instant('State')}:`,
                    style: 'boldText'
                },
                {
                    text: this.motionRepo.getExtendedStateLabel(motion)
                }
            ]);
        }

        // recommendation
        if (motion.recommendation && (!infoToExport || infoToExport.includes('recommendation'))) {
            let recommendationByText: string;

            if (motion.isStatuteAmendment()) {
                recommendationByText = this.configService.instant('motions_statute_recommendations_by');
            } else {
                recommendationByText = this.configService.instant('motions_recommendations_by');
            }

            metaTableBody.push([
                {
                    text: `${recommendationByText}:`,
                    style: 'boldText'
                },
                {
                    text: this.motionRepo.getExtendedRecommendationLabel(motion)
                }
            ]);
        }

        // category
        if (motion.category && (!infoToExport || infoToExport.includes('category'))) {
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Category')}:`,
                    style: 'boldText'
                },
                {
                    text: motion.category.prefix
                        ? `${motion.category.prefix} - ${motion.category.name}`
                        : `${motion.category.name}`
                }
            ]);
        }

        // tags
        if (motion.tags.length && (!infoToExport || infoToExport.includes('tags'))) {
            const tags = motion.tags
                .map(tag => {
                    return tag;
                })
                .join(', ');

            metaTableBody.push([
                {
                    text: `${this.translate.instant('Tags')}:`,
                    style: 'boldText'
                },
                {
                    text: tags
                }
            ]);
        }

        // motion block
        if (motion.motion_block && (!infoToExport || infoToExport.includes('motion_block'))) {
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Motion block')}:`,
                    style: 'boldText'
                },
                {
                    text: motion.motion_block.title
                }
            ]);
        }

        // origin
        if (motion.origin && (!infoToExport || infoToExport.includes('origin'))) {
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Origin')}:`,
                    style: 'boldText'
                },
                {
                    text: motion.origin
                }
            ]);
        }

        // voting results
        if (motion.motion.polls.length && (!infoToExport || infoToExport.includes('polls'))) {
            const column1 = [];
            const column2 = [];
            const column3 = [];
            motion.motion.polls.map((poll, index) => {
                if (poll.has_votes) {
                    if (motion.motion.polls.length > 1) {
                        column1.push(index + 1 + '. ' + this.translate.instant('Vote'));
                        column2.push('');
                        column3.push('');
                    }
                    const values: CalculablePollKey[] = ['yes', 'no', 'abstain'];
                    if (poll.votesvalid) {
                        values.push('votesvalid');
                    }
                    if (poll.votesinvalid) {
                        values.push('votesinvalid');
                    }
                    if (poll.votescast) {
                        values.push('votescast');
                    }
                    values.map(value => {
                        column1.push(`${this.translate.instant(this.pollService.getLabel(value))}:`);
                        column2.push(`${this.translate.instant(this.pollService.getSpecialLabel(poll[value]))}`);
                        this.pollService.isAbstractValue(poll, value)
                            ? column3.push('')
                            : column3.push(`(${this.pollService.calculatePercentage(poll, value)} %)`);
                    });
                }
            });
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Voting result')}:`,
                    style: 'boldText'
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
                        }
                    ],
                    columnGap: 7
                }
            ]);
        }

        // summary of change recommendations (for motion diff version only)
        const changes = this.getUnifiedChanges(motion, lineLength);

        if (crMode === ChangeRecoMode.Diff && changes.length > 0) {
            const columnLineNumbers = [];
            const columnChangeType = [];

            changes.forEach(change => {
                // TODO: the function isTitleRecommendation() does not exist anymore.
                //       Not sure if required or not
                // if (changeReco.isTitleRecommendation()) {
                //     columnLineNumbers.push(gettextCatalog.getString('Title') + ': ');
                // } else { ... }

                // line numbers column
                let line;
                if (change.getLineFrom() >= change.getLineTo() - 1) {
                    line = change.getLineFrom();
                } else {
                    line = change.getLineFrom() + ' - ' + (change.getLineTo() - 1);
                }

                // change type column
                if (change.getChangeType() === ViewUnifiedChangeType.TYPE_CHANGE_RECOMMENDATION) {
                    const changeReco = change as ViewMotionChangeRecommendation;
                    columnLineNumbers.push(`${this.translate.instant('Line')} ${line}: `);
                    columnChangeType.push(
                        `(${this.translate.instant('Change recommendation')}) - ${this.translate.instant(
                            this.getRecommendationTypeName(changeReco)
                        )}`
                    );
                } else if (change.getChangeType() === ViewUnifiedChangeType.TYPE_AMENDMENT) {
                    const amendment = change as ViewMotionAmendedParagraph;
                    let summaryText = `(${this.translate.instant('Amendment')} ${amendment.getIdentifier()}) -`;
                    if (amendment.isRejected()) {
                        summaryText += ` ${this.translate.instant('Rejected')}`;
                    } else if (amendment.isAccepted()) {
                        summaryText += ` ${this.translate.instant(amendment.stateName)}`;
                        // only append line and change, if the merge of the state of the amendment is accepted.
                        columnLineNumbers.push(`${this.translate.instant('Line')} ${line}: `);
                        columnChangeType.push(summaryText);
                    }
                }
            });

            if (columnChangeType.length > 0) {
                metaTableBody.push([
                    {
                        text: this.translate.instant('Summary of changes'),
                        style: 'boldText'
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
                        columnGap: 7
                    }
                ]);
            }
        }

        if (metaTableBody.length > 0) {
            return {
                table: {
                    widths: ['35%', '65%'],
                    body: metaTableBody
                },
                margin: [0, 0, 0, 20],
                // That did not work too well in the past. Perhaps substitution by a pdfWorker the worker will be necessary
                layout: {
                    fillColor: () => {
                        return '#dddddd';
                    },
                    hLineWidth: (i, node) => {
                        return i === 0 || i === node.table.body.length ? 0 : 0.5;
                    },
                    vLineWidth: () => {
                        return 0;
                    },
                    hLineColor: () => {
                        return 'white';
                    }
                }
            };
        }
    }

    /**
     * Creates the motion preamble
     *
     * @param motion the target motion
     * @returns doc def for the motion text
     */
    private createPreamble(motion: ViewMotion): object {
        return {
            text: `${this.translate.instant(this.configService.instant('motions_preamble'))}`,
            margin: [0, 10, 0, 10]
        };
    }

    /**
     * Creates the motion text - uses HTML to PDF
     *
     * @param motion the motion to convert to pdf
     * @param lnMode determine the used line mode
     * @param crMode determine the used change Recommendation mode
     * @returns doc def for the "the assembly may decide" preamble
     */
    private createText(
        motion: ViewMotion,
        lineLength: number,
        lnMode: LineNumberingMode,
        crMode: ChangeRecoMode
    ): object {
        let motionText: string;

        if (motion.isParagraphBasedAmendment()) {
            motionText = '';
            // this is logically redundant with the formation of amendments in the motion-detail html.
            // Should be refactored in a way that a service returns the correct html for both cases
            for (const paragraph of this.motionRepo.getAmendedParagraphs(motion, lineLength)) {
                if (paragraph.diffLineTo === paragraph.diffLineFrom + 1) {
                    motionText += `<h3>
                        ${this.translate.instant('Line')} ${paragraph.diffLineFrom}:
                    </h3>`;
                } else {
                    motionText += `<h3>
                        ${this.translate.instant('Line')} ${paragraph.diffLineFrom} - ${paragraph.diffLineTo - 1}:
                    </h3>`;
                }

                motionText += `<div class="paragraphcontext">${paragraph.textPre}</div>`;
                motionText += paragraph.text;
                motionText += `<div class="paragraphcontext">${paragraph.textPost}</div>`;
            }
        } else if (motion.isStatuteAmendment()) {
            // statute amendments
            const statutes = this.statuteRepo.getViewModelList();
            motionText = this.motionRepo.formatStatuteAmendment(statutes, motion, lineLength);
        } else {
            // lead motion or normal amendments
            // TODO: Consider tile change recommendation

            const changes = this.getUnifiedChanges(motion, lineLength);
            motionText = this.motionRepo.formatMotion(motion.id, crMode, changes, lineLength);
            // reformat motion text to split long HTML elements to easier convert into PDF
            motionText = this.linenumberingService.splitInlineElementsAtLineBreaks(motionText);
        }

        return this.htmlToPdfService.convertHtml(motionText, lnMode);
    }

    /**
     * changes need to be sorted, by "line from".
     * otherwise, formatMotion will make unexpected results by messing up the
     * order of changes applied to the motion
     *
     * TODO: Cleanup, everything change reco and amendment based needs a unified structure.
     *
     * @param motion
     * @param lineLength
     * @returns
     */
    private getUnifiedChanges(motion: ViewMotion, lineLength: number): ViewUnifiedChange[] {
        return this.changeRecoRepo
            .getChangeRecoOfMotion(motion.id)
            .concat(
                this.motionRepo
                    .getAmendmentsInstantly(motion.id)
                    .flatMap((amendment: ViewMotion) =>
                        this.motionRepo.getAmendmentAmendedParagraphs(amendment, lineLength)
                    )
            )
            .sort((a, b) => a.getLineFrom() - b.getLineFrom()) as ViewUnifiedChange[];
    }

    /**
     * Creates the motion reason - uses HTML to PDF
     *
     * @param motion the target motion
     * @returns doc def for the reason as array
     */
    private createReason(motion: ViewMotion, lnMode: LineNumberingMode): object {
        if (motion.reason) {
            const reason = [];

            // add the reason "head line"
            reason.push({
                text: this.translate.instant('Reason'),
                style: 'heading3',
                margin: [0, 25, 0, 10]
            });

            // determine the width of the reason depending on line numbering
            // currently not used
            // let columnWidth: string;
            // if (lnMode === LineNumberingMode.Outside) {
            //     columnWidth = '80%';
            // } else {
            //     columnWidth = '100%';
            // }

            reason.push(this.htmlToPdfService.addPlainText(motion.reason));

            return reason;
        } else {
            return {};
        }
    }

    /**
     * Creates pdfMake definitions for the call list of given motions
     * Any motions that are 'top level' (no sort_parent_id) will have their tags
     * used as comma separated header titles in an extra row
     *
     * @param motions A list of motions
     * @returns definitions ready to be opened or exported via {@link PdfDocumentService}
     */
    public callListToDoc(motions: ViewMotion[]): object {
        motions.sort((a, b) => a.weight - b.weight);
        const title = {
            text: this.translate.instant('Call list'),
            style: 'title'
        };
        const callListTableBody: object[] = [
            [
                {
                    text: this.translate.instant('Called'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Called with'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Submitters'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Title'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Recommendation'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Notes'),
                    style: 'tableHeader'
                }
            ]
        ];

        const callListRows: object[] = [];
        let currentTitle = '';

        motions.forEach(motion => {
            if (!motion.sort_parent_id) {
                const heading = motion.tags ? motion.tags.map(tag => tag.name).join(', ') : '';
                if (heading !== currentTitle) {
                    callListRows.push([
                        {
                            text: heading,
                            colSpan: 6,
                            style: 'heading3',
                            margin: [0, 10, 0, 10]
                        },
                        '',
                        '',
                        '',
                        '',
                        ''
                    ]);
                    currentTitle = heading;
                }
            }
            callListRows.push(this.createCallListRow(motion));
        });

        const table: object = {
            table: {
                widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto'],
                headerRows: 1,
                dontBreakRows: true,
                body: callListTableBody.concat(callListRows)
            },
            layout: this.pdfDocumentService.switchColorTableLayout
        };
        return [title, table];
    }

    /**
     * Creates the pdfMake definitions for a row of the call List table
     *
     * @param motion
     * @returns pdfmakre definitions
     */
    private createCallListRow(motion: ViewMotion): object {
        return [
            {
                text: motion.sort_parent_id ? '' : motion.identifierOrTitle
            },
            { text: motion.sort_parent_id ? motion.identifierOrTitle : '' },
            { text: motion.submitters.length ? motion.submitters.map(s => s.short_name).join(', ') : '' },
            { text: motion.title },
            {
                text: motion.recommendation ? this.motionRepo.getExtendedRecommendationLabel(motion) : ''
            },
            { text: '' }
        ];
    }

    /**
     * Creates pdfmake definitions for basic information about the motion and
     * comments or notes
     *
     * @param note string optionally containing html layout
     * @param motion the ViewMotion this note refers to
     * @param noteTitle additional heading to be used (will be translated)
     * @returns pdfMake definitions
     */
    public textToDocDef(note: string, motion: ViewMotion, noteTitle: string): object {
        const title = this.createTitle(motion);
        const subtitle = this.createSubtitle(motion);
        const metaInfo = this.createMetaInfoTable(
            motion,
            this.configService.instant<number>('motions_line_length'),
            this.configService.instant('motions_recommendation_text_mode'),
            ['submitters', 'state', 'category']
        );
        const noteContent = this.htmlToPdfService.convertHtml(note, LineNumberingMode.None);

        const subHeading = {
            text: this.translate.instant(noteTitle),
            style: 'heading2'
        };
        return [title, subtitle, metaInfo, subHeading, noteContent];
    }

    private createComments(motion: ViewMotion, comments: number[]): object[] {
        const result: object[] = [];
        for (const comment of comments) {
            const viewComment = this.commentRepo.getViewModel(comment);
            const section = motion.getCommentForSection(viewComment);
            if (section && section.comment) {
                result.push({ text: viewComment.name, style: 'heading3', margin: [0, 25, 0, 10] });
                result.push(this.htmlToPdfService.addPlainText(section.comment));
            }
        }
        return result;
    }
}
