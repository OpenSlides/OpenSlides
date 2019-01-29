import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

import pdfMake from 'pdfmake/build/pdfmake';
import { TranslateService } from '@ngx-translate/core';
// import { WebWorkerService } from 'angular2-web-worker/web-worker.service';
// import { WebWorkerService } from 'angular7-web-worker/web-worker.service';
import { WebWorkerService } from 'angular7-web-worker';
// import { WebWorkerService } from 'ngx-web-worker';

import { ConfigService } from './config.service';
import { HttpService } from './http.service';

/**
 * An interface for the mapping of image placeholder name to the url of the
 * image
 */
export interface ImagePlaceHolder {
    placeholder: string;
    url: string;
}

/**
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
        private webWorkerService: WebWorkerService,
        private configService: ConfigService,
        private httpService: HttpService
    ) {}

    /**
     * Define the pdfmake virtual file system for fonts
     *
     * @param images an optional mapping of images urls to be fetched and inserted
     *   into placeholders
     * @returns the vfs-object
     */
    private async initVfs(images?: ImagePlaceHolder[]): Promise<object> {
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
                    [fontPath.split('/').pop()]: base64
                };
            });
        });
        let imagePromises = [];
        if (images && images.length) {
            imagePromises = images.map(image => {
                return this.convertUrlToBase64(image.url).then(base64 => {
                    return {
                        [image.placeholder]: base64
                    };
                });
            });
        }
        const binaryDataUrls = await Promise.all(promises.concat(imagePromises));
        let vfs = {};
        binaryDataUrls.map(entry => {
            vfs = {
                ...vfs,
                ...entry
            };
        });
        return vfs;
    }

    /**
     * Retrieves a binary file from the url and returns a base64 value
     *
     * @param url file url
     * @returns a promise with a base64 string
     */
    public async convertUrlToBase64(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const headers = new HttpHeaders();
            this.httpService.get<Blob>(url, {}, {}, headers, 'blob').then(file => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const resultStr: string = reader.result as string;
                    resolve(resultStr.split(',')[1]);
                };
                reader.onerror = error => {
                    reject(error);
                };
            });
        });
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
     * @param metadata
     * @param images Array of optional images (url, placeholder) to be inserted
     * @returns the pdf document definition ready to export
     */
    private async getStandardPaper(
        documentContent: object,
        metadata?: object,
        images?: ImagePlaceHolder[]
    ): Promise<object> {
        this.initFonts();
        pdfMake.vfs = await this.initVfs(images);
        return {
            pageSize: 'A4',
            pageMargins: [75, 90, 75, 75],
            defaultStyle: {
                font: 'PdfFont',
                fontSize: this.configService.instant('general_export_pdf_fontsize')
            },
            header: this.getHeader(),
            // TODO: option for no footer, wherever this can be defined
            footer: this.getFooter(),
            // footer: (currentPage, pageCount) => {
            //     return this.getFooter(currentPage, pageCount);
            // },
            info: metadata,
            content: documentContent,
            styles: this.getStandardPaperStyles(),
            images: this.getImageUrls()
        };
    }

    /**
     * Overall document definition and styles for blank PDF documents
     * (e.g. ballots)
     *
     * @param documentContent the content of the pdf as object
     * @param image an optional image to insert into the ballot
     * @returns the pdf document definition ready to export
     */
    private async getBallotPaper(documentContentObject: object, image?: ImagePlaceHolder): Promise<object> {
        const images = image ? [image] : null;
        this.initFonts();
        pdfMake.vfs = await this.initVfs(images);
        return {
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0],
            defaultStyle: {
                font: 'PdfFont',
                fontSize: 10
            },
            content: documentContentObject,
            styles: this.getBlankPaperStyles()
        };
    }

    /**
     * Define fonts
     */
    private initFonts(): void {
        pdfMake.fonts = {
            PdfFont: {
                normal: this.getFontName('font_regular'),
                bold: this.getFontName('font_bold'),
                italics: this.getFontName('font_italic'),
                bolditalics: this.getFontName('font_bold_italic')
            }
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
    // private getFooter(currentPage: number, pageCount: number): object {
    private getFooter(): object {
        const columns = [];
        let logoContainerWidth: string;
        // let pageNumberPosition: string;
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
        // if (logoFooterLeftUrl && logoFooterRightUrl) {
        //     pageNumberPosition = 'center';
        // } else if (logoFooterLeftUrl && !logoFooterRightUrl) {
        //     pageNumberPosition = 'right';
        // } else if (logoFooterRightUrl && !logoFooterLeftUrl) {
        //     pageNumberPosition = 'left';
        // } else {
        //     pageNumberPosition = this.configService.instant('general_export_pdf_pagenumber_alignment');
        // }

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
        // columns.push({
        //     text: `${currentPage} / ${pageCount}`,
        //     style: 'footerPageNumber',
        //     alignment: pageNumberPosition
        // });

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
     * Downloads a pdf with the standard page definitions.
     *
     * @param docDefinition the structure of the PDF document
     * @param filename the name of the file to use
     * @param metadata
     */
    public download(docDefinition: object, filename: string, metadata?: object): void {
        this.getStandardPaper(docDefinition, metadata).then(doc => {
            this.createPdf(doc, filename);
        });
    }

    /**
     * Downloads a pdf with the ballot papet page definitions.
     *
     * @param docDefinition the structure of the PDF document
     * @param filename the name of the file to use
     * @param logo (optional) url of a logo to be placed as ballot logo
     */
    public downloadWithBallotPaper(docDefinition: object, filename: string, logo?: string): void {
        const images: ImagePlaceHolder = logo ? { placeholder: 'ballot-logo', url: logo } : null;
        this.getBallotPaper(docDefinition, images).then(doc => {
            this.createPdf(doc, filename);
        });
    }

    /**
     * Triggers the actual page creation and saving.
     *
     * @param doc the finished layout
     * @param filename the filename (without extension) to save as
     */
    private createPdf(doc: object, filename: string): void {

        const workerPromise = this.webWorkerService.run(this.test, doc)

        workerPromise.then(result => {


            console.log("result ", result);
        })

        // pdfMake.createPdf(doc).getBlob(blob => {
        //     saveAs(blob, `${filename}.pdf`, { autoBOM: true });
        // });
    }

    private test(doc: object): any {
        console.log("in ww thrad: ", doc);

        const a = pdfMake.createPdf(doc);
        console.log("a = ", a);


        // return ;


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
            preamble: {
                margin: [0, 0, 0, 10]
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
            heading2: {
                fontSize: 14,
                margin: [0, 0, 0, 10],
                bold: true
            },
            heading3: {
                fontSize: 12,
                margin: [0, 10, 0, 0],
                bold: true
            },
            tocEntry: {
                fontSize: 12,
                margin: [0, 0, 0, 0],
                bold: false
            },
            tocCategoryEntry: {
                fontSize: 12,
                margin: [10, 0, 0, 0],
                bold: false
            },
            tocCategoryTitle: {
                fontSize: 12,
                margin: [0, 0, 0, 4],
                bold: true
            },
            tocCategorySection: {
                margin: [0, 0, 0, 10]
            }
        };
    }

    /**
     * Definition of styles for ballot papers
     *
     * @returns an object that contains a limited set of pdf styles
     *  used for ballots
     */
    private getBlankPaperStyles(): object {
        return {
            title: {
                fontSize: 14,
                bold: true,
                margin: [30, 30, 0, 0]
            },
            description: {
                fontSize: 11,
                margin: [30, 0, 0, 0]
            }
        };
    }
}
