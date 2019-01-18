import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from './config.service';

/**
 * TODO: Images and fonts
 *
 * Provides the general document structure for PDF documents, such as page margins, header, footer and styles.
 * Also provides general purpose open and download functions.
 *
 * Use a local pdf service (i.e. MotionPdfService) to get the document definition for the content and use this service to
 * open or download the pdf document
 *
 * @example
 * ```ts
 * const motionContent = this.motionPdfService.motionToDocDef(this.motion);
 * this.this.pdfDocumentService.open(motionContent);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class PdfDocumentService {
    /**
     * Constructor
     *
     * @param translate translations
     * @param configService read config values
     */
    public constructor(private translate: TranslateService, private configService: ConfigService) {
        // It should be possible to add own fonts here
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
    }

    /**
     * Overall document definition and styles for the most PDF documents
     *
     * @param documentContent the content of the pdf as object
     * @returns the pdf document definition ready to export
     */
    private getStandardPaper(documentContent: object, metadata?: object): object {
        const standardFontSize = this.configService.instant('general_export_pdf_fontsize');

        return {
            pageSize: 'A4',
            pageMargins: [75, 90, 75, 75],
            defaultStyle: {
                // TODO add fonts to vfs
                // font: 'PdfFont',
                fontSize: standardFontSize
            },
            header: this.getHeader(),
            // TODO: option for no footer, wherever this can be defined
            footer: (currentPage, pageCount) => {
                return this.getFooter(currentPage, pageCount);
            },
            info: metadata,
            content: documentContent,
            styles: this.getStandardPaperStyles(),
            images: this.getImageUrls()
        };
    }

    /**
     * Creates the header doc definition for normal PDF documents
     *
     * @returns an object that contains the necessary header definition
     */
    private getHeader(): object {
        // check for the required logos
        let logoHeaderLeftUrl = this.configService.instant('logo_pdf_header_L').path;
        let logoHeaderRightUrl = this.configService.instant('logo_pdf_header_R').path;
        let text;
        const columns = [];

        // add the left logo to the header column
        if (logoHeaderLeftUrl) {
            if (logoHeaderLeftUrl.indexOf('/') === 0) {
                logoHeaderLeftUrl = logoHeaderLeftUrl.substr(1); // remove trailing /
            }
            columns.push({
                image: logoHeaderLeftUrl,
                fit: [180, 40],
                width: '20%'
            });
        }

        // add the header text if no logo on the right was specified
        if (logoHeaderLeftUrl && logoHeaderRightUrl) {
            text = '';
        } else {
            const line1 = [
                this.translate.instant(this.configService.instant('general_event_name')),
                this.translate.instant(this.configService.instant('general_event_description'))
            ]
                .filter(Boolean)
                .join(' – ');
            const line2 = [
                this.configService.instant('general_event_location'),
                this.configService.instant('general_event_date')
            ]
                .filter(Boolean)
                .join(', ');
            text = [line1, line2].join('\n');
        }
        columns.push({
            text: text,
            style: 'headerText',
            alignment: logoHeaderRightUrl ? 'left' : 'right'
        });

        // add the logo to the right
        if (logoHeaderRightUrl) {
            if (logoHeaderRightUrl.indexOf('/') === 0) {
                logoHeaderRightUrl = logoHeaderRightUrl.substr(1); // remove trailing /
            }
            columns.push({
                image: logoHeaderRightUrl,
                fit: [180, 40],
                alignment: 'right',
                width: '20%'
            });
        }

        return {
            color: '#555',
            fontSize: 9,
            margin: [75, 30, 75, 10], // [left, top, right, bottom]
            columns: columns,
            columnGap: 10
        };
    }

    /**
     * Creates the footer doc definition for normal PDF documents.
     * Adds page numbers into the footer
     *
     * TODO: Add footer logos.
     *
     * @param currentPage holds the number of the current page
     * @param pageCount holds the page count
     * @returns the footer doc definition
     */
    private getFooter(currentPage: number, pageCount: number): object {
        const columns = [];
        let logoContainerWidth: string;
        let pageNumberPosition: string;
        let logoConteinerSize: Array<number>;
        let logoFooterLeftUrl = this.configService.instant('logo_pdf_footer_L').path;
        let logoFooterRightUrl = this.configService.instant('logo_pdf_footer_R').path;

        // if there is a single logo, give it a lot of space
        if (logoFooterLeftUrl && logoFooterRightUrl) {
            logoContainerWidth = '20%';
            logoConteinerSize = [180, 40];
        } else {
            logoContainerWidth = '80%';
            logoConteinerSize = [400, 50];
        }

        // the position of the page number depends on the logos
        if (logoFooterLeftUrl && logoFooterRightUrl) {
            pageNumberPosition = 'center';
        } else if (logoFooterLeftUrl && !logoFooterRightUrl) {
            pageNumberPosition = 'right';
        } else if (logoFooterRightUrl && !logoFooterLeftUrl) {
            pageNumberPosition = 'left';
        } else {
            pageNumberPosition = this.configService.instant('general_export_pdf_pagenumber_alignment');
        }

        // add the left footer logo, if any
        if (logoFooterLeftUrl) {
            if (logoFooterLeftUrl.indexOf('/') === 0) {
                logoFooterLeftUrl = logoFooterLeftUrl.substr(1); // remove trailing /
            }
            columns.push({
                image: logoFooterLeftUrl,
                fit: logoConteinerSize,
                width: logoContainerWidth,
                alignment: 'left'
            });
        }

        // add the page number
        columns.push({
            text: `${currentPage} / ${pageCount}`,
            style: 'footerPageNumber',
            alignment: pageNumberPosition
        });

        // add the right footer logo, if any
        if (logoFooterRightUrl) {
            if (logoFooterRightUrl.indexOf('/') === 0) {
                logoFooterRightUrl = logoFooterRightUrl.substr(1); // remove trailing /
            }
            columns.push({
                image: logoFooterRightUrl,
                fit: logoConteinerSize,
                width: logoContainerWidth,
                alignment: 'right'
            });
        }

        return {
            margin: [75, 0, 75, 10],
            columns: columns,
            columnGap: 10
        };
    }

    /**
     * opens a pdf in a new tab
     *
     * @param docDefinition the structure of the PDF document
     */
    public open(docDefinition: object, metadata?: object): void {
        pdfMake.createPdf(this.getStandardPaper(docDefinition, metadata)).open();
    }

    /**
     * Downloads a pdf. Does not seem to work.
     *
     * @param docDefinition the structure of the PDF document
     */
    public download(docDefinition: object, filename: string, metadata?: object): void {
        pdfMake
            .createPdf(this.getStandardPaper(docDefinition, metadata))
            .getBlob(blob => saveAs(blob, `${filename}.pdf`, { autoBOM: true }));
    }

    /**
     * TODO
     *
     * Should create an images section in the document definition holding the base64 strings
     * for the urls
     *
     * @returns an object containing the image names and the corresponding base64 strings
     */
    private getImageUrls(): object {
        return {};
    }

    /**
     * Definition of styles for standard papers
     *
     * @returns an object that contains all pdf styles
     */
    private getStandardPaperStyles(): object {
        return {
            title: {
                fontSize: 18,
                margin: [0, 0, 0, 20],
                bold: true
            },
            subtitle: {
                fontSize: 9,
                margin: [0, -20, 0, 20],
                color: 'grey'
            },
            headerText: {
                fontSize: 10,
                margin: [0, 10, 0, 0]
            },
            footerPageNumber: {
                fontSize: 9,
                margin: [0, 15, 0, 0],
                color: '#555'
            },
            boldText: {
                bold: true
            },
            smallText: {
                fontSize: 8
            },
            heading3: {
                fontSize: 12,
                margin: [0, 10, 0, 0],
                bold: true
            }
        };
    }
}
