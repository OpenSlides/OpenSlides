import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';
import { MotionPdfService, InfoToExport } from './motion-pdf.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewCategory } from '../models/view-category';
import { PdfError, PdfDocumentService, StyleType, BorderType } from 'app/core/ui-services/pdf-document.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';

/**
 * Service to export a list of motions.
 *
 * @example
 * ```ts
 * const docDef = this.motionPdfCatalogService.motionListToDocDef(myListOfViewMotions);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPdfCatalogService {
    /**
     * Constructor
     *
     * @param translate handle translations
     * @param configService read out config variables
     * @param motionPdfService handle motion to pdf conversion
     */
    public constructor(
        private translate: TranslateService,
        private configService: ConfigService,
        private motionPdfService: MotionPdfService,
        private pdfService: PdfDocumentService,
        private motionRepo: MotionRepositoryService
    ) {}

    /**
     * Converts the list of motions to pdfmake doc definition.
     * Public entry point to conversion of multiple motions
     *
     * @param motions the list of view motions to convert
     * @param lnMode
     * @param crMode
     * @param contentToExport
     * @param infoToExport
     * @param commentsToExport
     * @returns pdfmake doc definition as object
     */
    public motionListToDocDef(
        motions: ViewMotion[],
        lnMode?: LineNumberingMode,
        crMode?: ChangeRecoMode,
        contentToExport?: string[],
        infoToExport?: InfoToExport[],
        commentsToExport?: number[]
    ): object {
        let doc = [];
        const motionDocList = [];

        for (let motionIndex = 0; motionIndex < motions.length; ++motionIndex) {
            try {
                const motionDocDef: any = this.motionPdfService.motionToDocDef(
                    motions[motionIndex],
                    lnMode,
                    crMode,
                    contentToExport,
                    infoToExport,
                    commentsToExport
                );

                // add id field to the first page of a motion to make it findable over TOC
                motionDocDef[0].id = `${motions[motionIndex].id}`;

                motionDocList.push(motionDocDef);

                if (motionIndex < motions.length - 1) {
                    motionDocList.push(this.pdfService.getPageBreak());
                }
            } catch (err) {
                const errorText = `${this.translate.instant('Error during PDF creation of motion:')} ${
                    motions[motionIndex].identifierOrTitle
                }`;
                console.error(`${errorText}\nDebugInfo:\n`, err);
                throw new PdfError(errorText);
            }
        }

        // print extra data (title, preamble, categories, toc) only if there are more than 1 motion
        if (motions.length > 1) {
            doc.push(
                this.pdfService.createTitle('motions_export_title'),
                this.pdfService.createPreamble('motions_export_preamble'),
                this.createToc(motions)
            );
        }

        doc = doc.concat(motionDocList);

        return doc;
    }

    /**
     * Creates the table of contents for the motion book.
     * Considers sorting by categories and no sorting.
     *
     * @param motions The motions to add in the TOC
     * @param sorting The optional sorting strategy
     * @returns the table of contents as document definition
     */
    private createToc(motions: ViewMotion[], sorting?: string): object {
        const toc = [];
        const categories: ViewCategory[] = this.getUniqueCategories(motions);

        // Create the toc title
        const tocTitle = {
            text: this.translate.instant('Table of contents'),
            style: 'heading2'
        };
        const exportSubmitterRecommendation = this.configService.instant<boolean>(
            'motions_export_submitter_recommendation'
        );

        // Initialize the header and the layout for border-style.
        const header = exportSubmitterRecommendation ? this.getTocHeaderDefinition() : undefined;
        const layout = exportSubmitterRecommendation ? BorderType.LIGHT_HORIZONTAL_LINES : BorderType.DEFAULT;

        if (categories && categories.length) {
            const catTocBody = [];
            for (const category of categories) {
                // push the name of the category
                // make a table for correct alignment
                catTocBody.push({
                    table: {
                        body: [
                            [
                                {
                                    text: category.prefix ? category.prefix + ' - ' + category.name : category.name,
                                    style: 'tocCategoryTitle'
                                }
                            ]
                        ]
                    },
                    layout: exportSubmitterRecommendation ? 'lightHorizontalLines' : 'noBorders'
                });

                const tocBody = [];
                for (const motion of motions.filter(motionIn => category === motionIn.category)) {
                    if (exportSubmitterRecommendation) {
                        tocBody.push(this.appendSubmittersAndRecommendation(motion, StyleType.CATEGORY_SECTION));
                    } else {
                        tocBody.push(
                            this.pdfService.createTocLine(
                                `${motion.identifier ? motion.identifier : ''}`,
                                motion.title,
                                `${motion.id}`,
                                StyleType.CATEGORY_SECTION
                            )
                        );
                    }
                }

                catTocBody.push(this.pdfService.createTocTableDef(tocBody, StyleType.CATEGORY_SECTION, layout, header));
            }

            // handle those without category
            const uncatTocBody = motions
                .filter(motion => !motion.category)
                .map(motion =>
                    this.pdfService.createTocLine(
                        `${motion.identifier ? motion.identifier : ''}`,
                        motion.title,
                        `${motion.id}`
                    )
                );

            // only push this array if there is at least one entry
            if (uncatTocBody.length > 0) {
                catTocBody.push(this.pdfService.createTocTableDef(uncatTocBody, StyleType.CATEGORY_SECTION));
            }

            toc.push(catTocBody);
        } else {
            // all motions in the same table
            const tocBody = [];
            for (const motion of motions) {
                if (exportSubmitterRecommendation) {
                    tocBody.push(this.appendSubmittersAndRecommendation(motion));
                } else {
                    tocBody.push(
                        this.pdfService.createTocLine(
                            `${motion.identifier ? motion.identifier : ''}`,
                            motion.title,
                            `${motion.id}`
                        )
                    );
                }
            }
            toc.push(this.pdfService.createTocTableDef(tocBody, StyleType.CATEGORY_SECTION, layout, header));
        }

        return [tocTitle, toc, this.pdfService.getPageBreak()];
    }

    /**
     * Function to get the definition for the header
     * for exporting motion-list as PDF. Needed, if submitters
     * and recommendation should also be exported to the `Table of Contents`.
     *
     * @returns {object} The DocDefinition for `pdfmake.js`.
     */
    private getTocHeaderDefinition(): object {
        return [
            { text: this.translate.instant('Identifier'), style: 'tocHeaderRow' },
            {
                text: `${this.translate.instant('Title')} · ${this.translate.instant(
                    'Submitters'
                )} · ${this.translate.instant('Recommendation')}`,
                style: 'tocHeaderRow'
            },
            { text: this.translate.instant('Page'), style: 'tocHeaderRow', alignment: 'right' }
        ];
    }

    /**
     * Extract the used categories from the given motion list.
     *
     * @param motions the list of motions
     * @returns Unique list of categories
     */
    private getUniqueCategories(motions: ViewMotion[]): ViewCategory[] {
        const categories: ViewCategory[] = motions
            // remove motions without category
            .filter(motion => !!motion.category)
            // map motions their categories
            .map(motion => motion.category)
            // remove redundancies
            .filter(
                (category, index, self) =>
                    index ===
                    self.findIndex(compare => compare.prefix === category.prefix && compare.name === category.name)
            );

        return categories;
    }

    /**
     * Creates lines for the `Table of contents` containing submitters and recommendation.
     *
     * @param motion The motion containing the information
     * @param style Optional `StyleType`. Defaults to `tocEntry`.
     *
     * @returns {Array<Object>} An array containing the `DocDefinitions` for `pdf-make`.
     */
    private appendSubmittersAndRecommendation(motion: ViewMotion, style: StyleType = StyleType.DEFAULT): Array<Object> {
        const recommendation = this.motionRepo.getExtendedRecommendationLabel(motion);
        let submitterList = '';
        for (let i = 0; i < motion.submitters.length; ++i) {
            submitterList +=
                i !== motion.submitters.length - 1
                    ? motion.submitters[i].getTitle() + ', '
                    : motion.submitters[i].getTitle();
        }
        return this.pdfService.createTocLine(
            `${motion.identifier ? motion.identifier : ''}`,
            motion.title,
            `${motion.id}`,
            style,
            this.pdfService.createTocLineInline(submitterList),
            this.pdfService.createTocLineInline(recommendation)
        );
    }
}
