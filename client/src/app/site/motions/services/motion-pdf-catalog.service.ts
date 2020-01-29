import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { BorderType, PdfDocumentService, PdfError, StyleType } from 'app/core/pdf-services/pdf-document.service';
import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { MotionExportInfo } from './motion-export.service';
import { MotionPdfService } from './motion-pdf.service';
import { ViewCategory } from '../models/view-category';
import { ViewMotion } from '../models/view-motion';

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
    private categoryObserver: BehaviorSubject<ViewCategory[]>;

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
        private motionRepo: MotionRepositoryService,
        private categoryRepo: CategoryRepositoryService
    ) {
        this.categoryObserver = this.categoryRepo.getViewModelListBehaviorSubject();
    }

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
    public motionListToDocDef(motions: ViewMotion[], exportInfo: MotionExportInfo): object {
        let doc = [];
        const motionDocList = [];
        const printToc = exportInfo.pdfOptions.includes('toc');
        const enforcePageBreaks = exportInfo.pdfOptions.includes('addBreaks');

        for (let motionIndex = 0; motionIndex < motions.length; ++motionIndex) {
            try {
                const motionDocDef: any = this.motionPdfService.motionToDocDef(motions[motionIndex], exportInfo);

                // add id field to the first page of a motion to make it findable over TOC
                motionDocDef[0].id = `${motions[motionIndex].id}`;

                motionDocList.push(motionDocDef);

                if (motionIndex < motions.length - 1 && enforcePageBreaks) {
                    motionDocList.push(this.pdfService.getPageBreak());
                } else if (motionIndex < motions.length - 1 && !enforcePageBreaks) {
                    motionDocList.push(this.pdfService.getSpacer());
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
        if (motions.length > 1 && (!exportInfo.pdfOptions || printToc)) {
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
        const categories = this.categoryObserver.value;

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
            for (const category of categories.sort((a, b) => a.weight - b.weight)) {
                // find out if the category has any motions
                const motionToCurrentCat = motions.filter(motionIn => category === motionIn.category);

                if (motionToCurrentCat && motionToCurrentCat.length) {
                    // if this is not the first page, start with a pagebreak
                    if (catTocBody.length) {
                        catTocBody.push(this.pdfService.getPageBreak());
                    }

                    catTocBody.push({
                        table: {
                            body: [
                                [
                                    {
                                        text: category.nameWithParentAbove,
                                        style: !!category.parent ? 'tocSubcategoryTitle' : 'tocCategoryTitle'
                                    }
                                ]
                            ]
                        },
                        layout: exportSubmitterRecommendation ? 'lightHorizontalLines' : 'noBorders'
                    });

                    const tocBody = [];
                    for (const motion of motionToCurrentCat) {
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

                    catTocBody.push(
                        this.pdfService.createTocTableDef(
                            tocBody,
                            StyleType.CATEGORY_SECTION,
                            layout,
                            header ? JSON.parse(JSON.stringify(header)) : null
                        )
                    );
                }
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
                catTocBody.push(this.pdfService.getPageBreak());
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
     * and recommendation should also be exported to the `Table of contents`.
     *
     * @returns {object} The DocDefinition for `pdfmake.js`.
     */
    private getTocHeaderDefinition(): object {
        return [
            { text: this.translate.instant('Identifier'), style: 'tocHeaderRow' },
            {
                style: 'tocHeaderRow',
                text: [
                    `${this.translate.instant('Title')} · ${this.translate.instant('Submitters')} · `,
                    { text: `${this.translate.instant('Recommendation')}`, italics: true }
                ]
            },
            { text: this.translate.instant('Page'), style: 'tocHeaderRow', alignment: 'right' }
        ];
    }

    /**
     * Creates lines for the `Table of contents` containing submitters and recommendation.
     *
     * @param motion The motion containing the information
     * @param style Optional `StyleType`. Defaults to `tocEntry`.
     *
     * @returns {Array<Object>} An array containing the `DocDefinitions` for `pdf-make`.
     */
    private appendSubmittersAndRecommendation(motion: ViewMotion, style: StyleType = StyleType.DEFAULT): Object[] {
        let submitterList = '';
        let state = '';
        if (motion.state.isFinalState) {
            state = this.motionRepo.getExtendedStateLabel(motion);
        } else {
            state = this.motionRepo.getExtendedRecommendationLabel(motion);
        }
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
            this.pdfService.createTocLineInline(state, true)
        );
    }
}
