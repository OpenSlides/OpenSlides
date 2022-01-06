import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HtmlToPdfService } from 'app/core/pdf-services/html-to-pdf.service';
import { PdfDocumentService } from 'app/core/pdf-services/pdf-document.service';
import { ChangeRecommendationRepositoryService } from 'app/core/repositories/motions/change-recommendation-repository.service';
import { MotionCommentSectionRepositoryService } from 'app/core/repositories/motions/motion-comment-section-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { StatuteParagraphRepositoryService } from 'app/core/repositories/motions/statute-paragraph-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { LinenumberingService } from 'app/core/ui-services/linenumbering.service';
import { ViewUnifiedChange, ViewUnifiedChangeType } from 'app/shared/models/motions/view-unified-change';
import { ParsePollNumberPipe } from 'app/shared/pipes/parse-poll-number.pipe';
import { PollKeyVerbosePipe } from 'app/shared/pipes/poll-key-verbose.pipe';
import { getRecommendationTypeName } from 'app/shared/utils/recommendation-type-names';
import { MotionExportInfo } from './motion-export.service';
import { MotionPollService } from './motion-poll.service';
import { ChangeRecoMode, InfoToExport, LineNumberingMode, PERSONAL_NOTE_ID } from '../motions.constants';
import { ViewMotion } from '../models/view-motion';
import { ViewMotionAmendedParagraph } from '../models/view-motion-amended-paragraph';
import { ViewMotionChangeRecommendation } from '../models/view-motion-change-recommendation';

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
        private linenumberingService: LinenumberingService,
        private commentRepo: MotionCommentSectionRepositoryService,
        private pollKeyVerbose: PollKeyVerbosePipe,
        private parsePollNumber: ParsePollNumberPipe,
        private motionPollService: MotionPollService
    ) {}

    /**
     * Converts a motion to PdfMake doc definition
     *
     * @param motion the motion to convert to pdf
     * @param lnMode determine the used line mode
     * @param crMode determine the used change Recommendation mode
     * @param contentToExport determine which content is to export. If left out, everything will be exported
     * @param infoToExport determine which metaInfo to export. If left out, everything will be exported.
     * @param commentsToExport comments to chose for export. If 'allcomments' is set in infoToExport,
     *                         this selection will be ignored and all comments exported
     * @returns doc def for the motion
     */
    public motionToDocDef(motion: ViewMotion, exportInfo?: MotionExportInfo): object {
        let lnMode = exportInfo && exportInfo.lnMode ? exportInfo.lnMode : null;
        let crMode = exportInfo && exportInfo.crMode ? exportInfo.crMode : null;
        const infoToExport = exportInfo ? exportInfo.metaInfo : null;
        const contentToExport = exportInfo ? exportInfo.content : null;
        let commentsToExport = exportInfo ? exportInfo.comments : null;

        // get the line length from the config
        const lineLength = this.configService.instant<number>('motions_line_length');
        // whether to append checkboxes to follow the recommendation or not
        const optionToFollowRecommendation = this.configService.instant<boolean>(
            'motions_export_follow_recommendation'
        );

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

        const title = this.createTitle(motion, crMode, lineLength);
        const sequential =
            infoToExport?.includes('id') ?? this.configService.instant<boolean>('motions_show_sequential_numbers');
        const subtitle = this.createSubtitle(motion, sequential);

        motionPdfContent = [title, subtitle];

        if ((infoToExport && infoToExport.length > 0) || !infoToExport) {
            const metaInfo = this.createMetaInfoTable(
                motion,
                lineLength,
                crMode,
                infoToExport,
                optionToFollowRecommendation
            );
            motionPdfContent.push(metaInfo);
        }

        if (!contentToExport || contentToExport.includes('text')) {
            if (motion.showPreamble) {
                const preamble = this.createPreamble(motion);
                motionPdfContent.push(preamble);
            }
            const text = this.createText(motion, lineLength, lnMode, crMode);
            motionPdfContent.push(text);
        }

        if (!contentToExport || contentToExport.includes('reason')) {
            const reason = this.createReason(motion, lnMode);
            motionPdfContent.push(reason);
        }

        if (infoToExport && infoToExport.includes('allcomments')) {
            commentsToExport = this.commentRepo.getViewModelList().map(vm => vm.id);
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
     * @param crMode the change recommendation mode
     * @param lineLength the line length
     * @returns doc def for the document title
     */
    private createTitle(motion: ViewMotion, crMode: ChangeRecoMode, lineLength: number): object {
        // summary of change recommendations (for motion diff version only)
        const changes = this.getUnifiedChanges(motion, lineLength);
        const titleChange = changes.find(change => change?.isTitleChange());
        const changedTitle = this.changeRecoRepo.getTitleWithChanges(motion.title, titleChange, crMode);

        const identifier = motion.identifier ? ' ' + motion.identifier : '';
        const pageSize = this.configService.instant('general_export_pdf_pagesize');
        let title = '';
        if (pageSize === 'A4') {
            title += `${this.translate.instant('Motion')} `;
        }

        title += `${identifier}: ${changedTitle}`;

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
        infoToExport?: InfoToExport[],
        optionToFollowRecommendation?: boolean
    ): object {
        const metaTableBody = [];

        // submitters
        if (!infoToExport || infoToExport.includes('submitters')) {
            const submitters = motion.submittersAsUsers
                .map(user => {
                    return user.full_name;
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

        // supporters
        if (!infoToExport || infoToExport.includes('supporters')) {
            const minSupporters = this.configService.instant<number>('motions_min_supporters');
            if (!!minSupporters && motion.supporters.length > 0) {
                const supporters = motion.supporters
                    .map(supporter => {
                        return supporter.full_name;
                    })
                    .join(', ');

                metaTableBody.push([
                    {
                        text: `${this.translate.instant('Supporters')}:`,
                        style: 'boldText'
                    },
                    {
                        text: supporters
                    }
                ]);
            }
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
            let categoryText = '';
            if (motion.category.parent) {
                categoryText = `${motion.category.parent.toString()}\n${this.translate.instant(
                    'Subcategory'
                )}: ${motion.category.toString()}`;
            } else {
                categoryText = motion.category.toString();
            }
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Category')}:`,
                    style: 'boldText'
                },
                {
                    text: categoryText
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
        if (motion.polls.length && (!infoToExport || infoToExport.includes('polls'))) {
            motion.polls.forEach(poll => {
                if (poll.hasVotes) {
                    const tableData = this.motionPollService.generateTableData(poll);
                    const column1 = [];
                    const column2 = [];
                    const column3 = [];
                    tableData.forEach(votingResult => {
                        const votingOption = this.translate.instant(
                            this.pollKeyVerbose.transform(votingResult.votingOption)
                        );
                        const value = votingResult.value[0];
                        const resultValue = this.parsePollNumber.transform(value.amount);
                        column1.push(`${votingOption}:`);
                        if (value.showPercent) {
                            const resultInPercent = this.motionPollService.getVoteValueInPercent(value.amount, {
                                poll,
                                row: votingResult
                            });
                            // hard check for "null" since 0 is a valid number in this case
                            if (resultInPercent !== null) {
                                column2.push(`(${resultInPercent})`);
                            } else {
                                column2.push('');
                            }
                        } else {
                            column2.push('');
                        }
                        column3.push(resultValue);
                    });
                    metaTableBody.push([
                        {
                            text: poll.title,
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
            });
        }

        // summary of change recommendations (for motion diff version only)
        const changes = this.getUnifiedChanges(motion, lineLength);

        if (crMode === ChangeRecoMode.Diff && changes.length > 0) {
            const columnLineNumbers = [];
            const columnChangeType = [];

            changes.forEach(change => {
                if (change.isTitleChange()) {
                    // Is always a change recommendation
                    const changeReco = change as ViewMotionChangeRecommendation;
                    columnLineNumbers.push(`${this.translate.instant('Title')}: `);
                    columnChangeType.push(
                        `(${this.translate.instant('Change recommendation')}) - ${this.translate.instant(
                            this.getRecommendationTypeName(changeReco)
                        )}`
                    );
                } else {
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
                }
            });

            if (columnChangeType.length > 0) {
                metaTableBody.push([
                    {
                        text: this.translate.instant('Summary of changes:'),
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

        // Checkboxes for resolution
        if (optionToFollowRecommendation) {
            metaTableBody.push([
                {
                    text: `${this.translate.instant('Decision')}:`,
                    style: 'boldText'
                },
                {
                    margin: [5, 2, 0, 2],
                    columns: [
                        {
                            width: 8,
                            canvas: this.pdfDocumentService.drawCircle(6.5, 4)
                        },
                        {
                            width: 'auto',
                            text: this.translate.instant('As recommendation')
                        },
                        {
                            width: 20,
                            text: ''
                        },
                        {
                            width: 8,
                            canvas: this.pdfDocumentService.drawCircle(6.5, 4)
                        },
                        {
                            width: 'auto',
                            text: this.translate.instant('Divergent:')
                        }
                    ]
                }
            ]);
        }

        if (metaTableBody.length > 0) {
            return {
                table: {
                    widths: ['35%', '65%'],
                    body: metaTableBody
                },
                margin: [0, 0, 0, 20],
                layout: 'metaboxLayout'
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
        const motions_preamble = this.configService.instant<string>('motions_preamble');
        return {
            text: `${this.translate.instant(motions_preamble)}`,
            margin: [0, 10, 0, 10]
        };
    }

    /**
     * Creates the motion text - uses HTML to PDF
     *
     * @param motion the motion to convert to pdf
     * @param lineLength the current line length
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
        let motionText = '';

        if (motion.isParagraphBasedAmendment()) {
            // this is logically redundant with the formation of amendments in the motion-detail html.
            // Should be refactored in a way that a service returns the correct html for both cases
            try {
                const changeRecos = this.changeRecoRepo.getChangeRecoOfMotion(motion.id);
                const amendmentParas = this.motionRepo.getAmendmentParagraphLines(
                    motion,
                    lineLength,
                    crMode,
                    changeRecos,
                    false
                );
                for (const paragraph of amendmentParas) {
                    motionText += '<h3>' + this.motionRepo.getAmendmentParagraphLinesTitle(paragraph) + '</h3>';
                    motionText += `<div class="paragraphcontext">${paragraph.textPre}</div>`;
                    motionText += paragraph.text;
                    motionText += `<div class="paragraphcontext">${paragraph.textPost}</div>`;
                }
            } catch (e) {
                motionText += '<em style="color: red; font-weight: bold;">' + e.toString() + '</em>';
            }
        } else if (motion.isStatuteAmendment()) {
            // statute amendments
            const statutes = this.statuteRepo.getViewModelList();
            motionText = this.motionRepo.formatStatuteAmendment(statutes, motion, lineLength);
        } else {
            // lead motion or normal amendments

            const changes = this.getUnifiedChanges(motion, lineLength);
            const textChanges = changes.filter(change => !change.isTitleChange());
            const titleChange = changes.find(change => change.isTitleChange());

            if (crMode === ChangeRecoMode.Diff && titleChange) {
                const changedTitle = this.changeRecoRepo.getTitleChangesAsDiff(motion.title, titleChange);
                motionText +=
                    '<span><strong>' +
                    this.translate.instant('Changed title') +
                    ':</strong><br>' +
                    changedTitle +
                    '</span><br>';
            }
            const formattedText = this.motionRepo.formatMotion(motion.id, crMode, textChanges, lineLength);
            // reformat motion text to split long HTML elements to easier convert into PDF
            motionText += this.linenumberingService.splitInlineElementsAtLineBreaks(formattedText);
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
        const motionChangeRecos = this.changeRecoRepo.getChangeRecoOfMotion(motion.id);

        const motionAmendments = this.motionRepo.getAmendmentsInstantly(motion.id).flatMap((amendment: ViewMotion) => {
            const changeRecos = this.changeRecoRepo
                .getChangeRecoOfMotion(amendment.id)
                .filter(reco => reco.showInFinalView());
            return this.motionRepo.getAmendmentAmendedParagraphs(amendment, lineLength, changeRecos);
        });

        return motionChangeRecos
            .concat(motionAmendments)
            .filter(change => !!change)
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
            layout: 'switchColorTableLayout'
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
            { text: motion.submitters.length ? motion.submittersAsUsers.map(s => s.short_name).join(', ') : '' },
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
        const lineLength = this.configService.instant<number>('motions_line_length');
        const crMode = this.configService.instant<ChangeRecoMode>('motions_recommendation_text_mode');
        const title = this.createTitle(motion, crMode, lineLength);
        const subtitle = this.createSubtitle(motion);
        const metaInfo = this.createMetaInfoTable(motion, lineLength, crMode, ['submitters', 'state', 'category']);
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
            let name = '',
                content = '';
            if (comment === PERSONAL_NOTE_ID) {
                name = this.translate.instant('Personal note');
                content = motion && motion.personalNote && motion.personalNote.note;
            } else {
                const viewComment = this.commentRepo.getViewModel(comment);
                const section = motion.getCommentForSection(viewComment);
                name = viewComment.name;
                content = section && section.comment;
            }
            if (name && content) {
                result.push({ text: name, style: 'heading3', margin: [0, 25, 0, 10] });
                result.push(this.htmlToPdfService.addPlainText(content));
            }
        }
        return result;
    }
}
