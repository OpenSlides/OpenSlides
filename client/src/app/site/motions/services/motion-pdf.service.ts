import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';
import { MotionRepositoryService } from './motion-repository.service';
import { ConfigService } from 'app/core/services/config.service';
import { ChangeRecommendationRepositoryService } from './change-recommendation-repository.service';
import { ViewUnifiedChange } from '../models/view-unified-change';
import { HtmlToPdfService } from 'app/core/services/html-to-pdf.service';

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
     * Constructor
     *
     * @param translate handle translations
     * @param motionRepo get parent motions
     * @param changeRecoRepo to get the change recommendations
     * @param configService Read config variables
     * @param htmlToPdfService To convert HTML text into pdfmake doc def
     */
    public constructor(
        private translate: TranslateService,
        private motionRepo: MotionRepositoryService,
        private changeRecoRepo: ChangeRecommendationRepositoryService,
        private configService: ConfigService,
        private htmlToPdfService: HtmlToPdfService
    ) {}

    /**
     * Converts a motion to PdfMake doc definition
     *
     * @param motion the motion to convert to pdf
     * @param lnMode determine the used line mode
     * @param crMode determine the used change Recommendation mode
     * @param contentToExport determine which content is to export. If left out, everything will be exported
     * @param infoToExport determine which metaInfo to export. If left out, everything will be exported.
     * @returns doc def for the motion
     */
    public motionToDocDef(
        motion: ViewMotion,
        lnMode?: LineNumberingMode,
        crMode?: ChangeRecoMode,
        contentToExport?: string[],
        infoToExport?: string[]
    ): object {
        let motionPdfContent = [];

        // determine the default lnMode if not explicitly given
        if (!lnMode) {
            lnMode = this.configService.instant('motions_default_line_numbering');
        }

        // determine the default crMode if not explicitly given
        if (!crMode) {
            crMode = this.configService.instant('motions_recommendation_text_mode');
        }

        const title = this.createTitle(motion);
        const subtitle = this.createSubtitle(motion);

        motionPdfContent = [title, subtitle];

        if ((infoToExport && infoToExport.length > 0) || !infoToExport) {
            const metaInfo = this.createMetaInfoTable(motion, crMode, infoToExport);
            motionPdfContent.push(metaInfo);
        }

        if (!contentToExport || contentToExport.includes('text')) {
            const preamble = this.createPreamble(motion);
            motionPdfContent.push(preamble);
            const text = this.createText(motion, lnMode, crMode);
            motionPdfContent.push(text);
        }

        if (!contentToExport || contentToExport.includes('reason')) {
            const reason = this.createReason(motion, lnMode);
            motionPdfContent.push(reason);
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
     * @returns doc def for the subtitle
     */
    private createSubtitle(motion: ViewMotion): object {
        const subtitleLines = [];

        // TODO: documents for motion amendments (having parents)
        //
        // if (motion.parent_id) {
        //     const parentMotion = this.motionRepo.getViewModel(motion.parent_id);
        //     subtitleLines.push(`${this.translate.instant('Amendment to motion')}: ${motion.identifierOrTitle}`);
        // }

        if (this.configService.instant('motions_export_sequential_number')) {
            subtitleLines.push(`${this.translate.instant('Sequential number')}: ${motion.id}`);
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
    private createMetaInfoTable(motion: ViewMotion, crMode: ChangeRecoMode, infoToExport?: string[]): object {
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

        // motion block
        if (motion.motion_block && (!infoToExport || infoToExport.includes('block'))) {
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

        // TODO: Voting result, depends on polls

        // summary of change recommendations (for motion diff version only)
        const changeRecos = this.changeRecoRepo.getChangeRecoOfMotion(motion.id);
        if (crMode === ChangeRecoMode.Diff && changeRecos.length > 0) {
            const columnLineNumbers = [];
            const columnChangeType = [];

            changeRecos.forEach(changeReco => {
                // TODO: the function isTitleRecommendation() does not exist anymore.
                //       Not sure if required or not
                // if (changeReco.isTitleRecommendation()) {
                //     columnLineNumbers.push(gettextCatalog.getString('Title') + ': ');
                // } else { ... }

                // line numbers column
                let line;
                if (changeReco.line_from >= changeReco.line_to - 1) {
                    line = changeReco.line_from;
                } else {
                    line = changeReco.line_from + ' - ' + (changeReco.line_to - 1);
                }
                columnLineNumbers.push(`${this.translate.instant('Line')} ${line}: `);

                // change type column
                if (changeReco.type === 0) {
                    columnChangeType.push(this.translate.instant('Replacement'));
                } else if (changeReco.type === 1) {
                    columnChangeType.push(this.translate.instant('Insertion'));
                } else if (changeReco.type === 2) {
                    columnChangeType.push(this.translate.instant('Deletion'));
                } else if (changeReco.type === 3) {
                    columnChangeType.push(changeReco.other_description);
                }
            });

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
    private createText(motion: ViewMotion, lnMode: LineNumberingMode, crMode: ChangeRecoMode): object {
        let motionText: string;
        if (motion.isParagraphBasedAmendment()) {
            // TODO: special docs for special amendment
        } else {
            // lead motion or normal amendments
            // TODO: Consider tile change recommendation
            const changes: ViewUnifiedChange[] = Object.assign(
                [],
                this.changeRecoRepo.getChangeRecoOfMotion(motion.id)
            );

            // changes need to be sorted, by "line from".
            // otherwise, formatMotion will make unexpected results by messing up the
            // order of changes applied to the motion
            changes.sort((a, b) => a.getLineFrom() - b.getLineFrom());

            // get the line length from the config
            const lineLength = this.configService.instant<number>('motions_line_length');

            motionText = this.motionRepo.formatMotion(motion.id, crMode, changes, lineLength);
        }

        return this.htmlToPdfService.convertHtml(motionText, lnMode);
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

            reason.push({
                columns: [
                    {
                        // width: columnWidth,
                        stack: this.htmlToPdfService.convertHtml(motion.reason)
                    }
                ]
            });

            return reason;
        } else {
            return {};
        }
    }
}
