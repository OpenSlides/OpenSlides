import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { HtmlToPdfService } from 'app/core/pdf-services/html-to-pdf.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Creates a PDF list for amendments
 */
@Injectable({
    providedIn: 'root'
})
export class AmendmentListPdfService {
    public constructor(
        private motionRepo: MotionRepositoryService,
        private translate: TranslateService,
        private htmlToPdfService: HtmlToPdfService
    ) {}

    /**
     * Also required by amendment-detail. Should be own service
     * @param amendment
     * @return rendered PDF text
     */
    private renderDiffLines(amendment: ViewMotion): object {
        if (amendment.diffLines && amendment.diffLines.length) {
            const linesHtml = amendment.diffLines.map(line => line.text).join('<br />[...]<br />');
            return this.htmlToPdfService.convertHtml(linesHtml);
        }
    }

    /**
     * Converts an amendment to a row of the `amendmentRows` table
     * @amendment the amendment to convert
     * @returns a line in the row as PDF doc definition
     */
    private amendmentToTableRow(amendment: ViewMotion): object {
        let recommendationText = '';
        if (amendment.recommendation) {
            if (amendment.recommendation.show_recommendation_extension_field && amendment.recommendationExtension) {
                recommendationText += ` ${this.motionRepo.getExtendedRecommendationLabel(amendment)}`;
            } else {
                recommendationText += this.translate.instant(amendment.recommendation.recommendation_label);
            }
        }

        return [
            {
                text: amendment.identifierOrTitle
            },
            {
                text: amendment.getChangeLines()
            },
            {
                text: amendment.submittersAsUsers.toString()
            },
            {
                // requires stack cause this can be an array
                stack: this.renderDiffLines(amendment)
            },
            {
                text: recommendationText
            }
        ];
    }

    /**
     * Creates the PDFmake document structure for amendment list overview
     * @param docTitle the header
     * @param amendments the amendments to render
     */
    public overviewToDocDef(docTitle: string, amendments: ViewMotion[]): object {
        const title = {
            text: docTitle,
            style: 'title'
        };

        const amendmentTableBody: object[] = [
            [
                {
                    text: this.translate.instant('Motion'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Line'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Submitters'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Changes'),
                    style: 'tableHeader'
                },
                {
                    text: this.translate.instant('Recommendation'),
                    style: 'tableHeader'
                }
            ]
        ];

        const amendmentRows: object[] = [];
        for (const amendment of amendments) {
            amendmentRows.push(this.amendmentToTableRow(amendment));
        }

        const table: object = {
            table: {
                widths: ['auto', 'auto', 'auto', '*', 'auto'],
                headerRows: 1,
                dontBreakRows: true,
                body: amendmentTableBody.concat(amendmentRows)
            },
            layout: 'switchColorTableLayout'
        };

        return [title, table];
    }
}
