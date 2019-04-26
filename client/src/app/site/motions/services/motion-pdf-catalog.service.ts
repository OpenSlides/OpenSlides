import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';
import { MotionPdfService, InfoToExport } from './motion-pdf.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewCategory } from '../models/view-category';
import { PdfError } from 'app/core/ui-services/pdf-document.service';

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
     * Helper to add page breaks to documents
     */
    private pageBreak = {
        text: '',
        pageBreak: 'after'
    };

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
        private motionPdfService: MotionPdfService
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
                    motionDocList.push(this.pageBreak);
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
            doc.push(this.createTitle(), this.createPreamble(), this.createToc(motions));
        }

        doc = doc.concat(motionDocList);

        return doc;
    }

    /**
     * Creates the title for the motion list as pdfmake doc definition
     *
     * @returns The motion list title for the PDF document
     */
    private createTitle(): object {
        const titleText = this.translate.instant(this.configService.instant<string>('motions_export_title'));
        return {
            text: titleText,
            style: 'title'
        };
    }

    /**
     * Creates the preamble for the motion list as pdfmake doc definition
     *
     * @returns The motion list preamble for the PDF document
     */
    private createPreamble(): object {
        const preambleText = this.configService.instant<string>('motions_export_preamble');

        if (preambleText) {
            return {
                text: preambleText,
                style: 'preamble'
            };
        } else {
            return {};
        }
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

        if (!sorting) {
            sorting = this.configService.instant<string>('motions_export_category_sorting');
        }
        const exportCategory = sorting === 'identifier' || sorting === 'prefix';

        if (exportCategory && categories) {
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
                    layout: 'noBorders'
                });

                const tocBody = motions
                    .filter(motion => category === motion.category)
                    .map(motion => this.createTocLine(motion, 'tocCategoryEntry'));

                catTocBody.push(this.createTocTableDef(tocBody));
            }

            // handle those without category
            const uncatTocBody = motions
                .filter(motion => !motion.category)
                .map(motion => this.createTocLine(motion, 'tocEntry'));

            // only push this array if there is at least one entry
            if (uncatTocBody.length > 0) {
                catTocBody.push(this.createTocTableDef(uncatTocBody));
            }

            toc.push(catTocBody);
        } else {
            // all motions in the same table
            const tocBody = motions.map(motion => this.createTocLine(motion, 'tocEntry'));
            toc.push(this.createTocTableDef(tocBody));
        }

        return [tocTitle, toc, this.pageBreak];
    }

    /**
     * Generates the table definition for the TOC
     *
     * @param tocBody the body of the table
     * @returns The table of contents as doc definition
     */
    private createTocTableDef(tocBody: object): object {
        return {
            table: {
                widths: ['auto', '*', 'auto'],
                body: tocBody
            },
            layout: 'noBorders',
            style: 'tocCategorySection'
        };
    }

    /**
     * Generates a line in the TOC as list object
     *
     * @param motion motion to make a toc entry to
     * @param style the desired style
     */
    private createTocLine(motion: ViewMotion, style: string): object {
        const firstColumn = motion.identifier;
        return [
            {
                text: firstColumn,
                style: style
            },
            {
                text: motion.title,
                style: 'tocEntry'
            },
            {
                pageReference: `${motion.id}`,
                style: 'tocEntry',
                alignment: 'right'
            }
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
}
