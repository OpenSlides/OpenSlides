import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

import pdfMake from 'pdfmake/build/pdfmake';
import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from './config.service';
import { HttpService } from './http.service';

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
     * @param mediaManageService to read out font files as media data
     */
    public constructor(
        private translate: TranslateService,
        private configService: ConfigService,
        private httpService: HttpService
    ) {}

    /**
     * Define the pdfmake virtual file system for fonts
     *
     * @returns the vfs-object
     */
    private async getVfs(): Promise<object> {
        const fontPathList: string[] = Array.from(
            // create a list without redundancies
            new Set(
                this.configService
                    .instant<string[]>('fonts_available')
                    .map(available => this.configService.instant<any>(available))
                    .map(font => font.path || `/${font.default}`)
            )
        );

        const promises = fontPathList.map(fontPath => {
            return this.convertUrlToBase64(fontPath).then(base64 => {
                return {
                    [fontPath.split('/').pop()]: base64.split(',')[1]
                };
            });
        });

        const fontDataUrls = await Promise.all(promises);

        let vfs = {};
        fontDataUrls.map(entry => {
            vfs = {
                ...vfs,
                ...entry
            };
        });

        return vfs;
    }

    /**
     * Converts a given blob to base64
     *
     * @param file File as blob
     * @returns a promise to the base64 as string
     */
    private async convertUrlToBase64(url: string): Promise<string> {
        const headers = new HttpHeaders();
        const file = await this.httpService.get<ArrayBuffer>(url, {}, {}, headers, 'arraybuffer');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(new Blob([file]));
            reader.onload = () => {
                const resultStr: string = reader.result as string;
                resolve(resultStr);
            };
            reader.onerror = error => {
                reject(error);
            };
        }) as Promise<string>;
    }

    /**
     * Returns the name of a font from the value of the given
     * config variable.
     *
     * @param fontType the config variable of the font (font_regular, font_italic)
     * @returns the name of the selected font
     */
    private getFontName(fontType: string): string {
        const font = this.configService.instant<any>(fontType);
        return (font.path || `/${font.default}`).split('/').pop();
    }

    /**
     * Overall document definition and styles for the most PDF documents
     *
     * @param documentContent the content of the pdf as object
     * @returns the pdf document definition ready to export
     */
    private async getStandardPaper(documentContent: object, metadata?: object): Promise<object> {
        // define the fonts
        pdfMake.fonts = {
            PdfFont: {
                normal: this.getFontName('font_regular'),
                bold: this.getFontName('font_bold'),
                italics: this.getFontName('font_italic'),
                bolditalics: this.getFontName('font_bold_italic')
            }
        };

        pdfMake.vfs = await this.getVfs();

        return {
            pageSize: 'A4',
            pageMargins: [75, 90, 75, 75],
            defaultStyle: {
                font: 'PdfFont',
                fontSize: this.configService.instant('general_export_pdf_fontsize')
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
        let logoHeaderLeftUrl = this.configService.instant<any>('logo_pdf_header_L').path;
        let logoHeaderRightUrl = this.configService.instant<any>('logo_pdf_header_R').path;
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
        let logoFooterLeftUrl = this.configService.instant<any>('logo_pdf_footer_L').path;
        let logoFooterRightUrl = this.configService.instant<any>('logo_pdf_footer_R').path;

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
        this.getStandardPaper(docDefinition, metadata).then(doc => {
            pdfMake.createPdf(doc).getBlob(blob => saveAs(blob, `${filename}.pdf`, { autoBOM: true }));
        });
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
