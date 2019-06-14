import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

import pdfMake from 'pdfmake/build/pdfmake';
import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from './config.service';
import { HttpService } from '../core-services/http.service';

/**
 * Enumeration to define possible values for the styling.
 */
export enum StyleType {
    DEFAULT = 'tocEntry',
    SUBTITLE = 'subtitle',
    SUB_ENTRY = 'tocSubEntry',
    CATEGORY_SECTION = 'tocCategorySection'
}

/**
 * Enumeration to describe the type of borders.
 */
export enum BorderType {
    DEFAULT = 'noBorders',
    LIGHT_HORIZONTAL_LINES = 'lightHorizontalLines',
    HEADER_ONLY = 'headerLineOnly'
}

/**
 * Custom PDF error class to handle errors in a safer way
 */
export class PdfError extends Error {
    public __proto__: PdfError;

    public constructor(public message: string) {
        super(message);
        const trueProto = new.target.prototype;
        this.__proto__ = trueProto;
    }
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
     * A list of all images to add to the virtual file system.
     * May still be filling at header and footer creation
     */
    private imageUrls: string[] = [];

    /**
     * Table layout that switches the background color every other row.
     * @example
     * ```ts
     * layout: this.pdfDocumentService.switchColorTableLayout
     * ```
     */
    public switchColorTableLayout = {
        hLineWidth: rowIndex => {
            return rowIndex === 1;
        },
        vLineWidth: () => {
            return 0;
        },
        fillColor: rowIndex => {
            return rowIndex % 2 === 0 ? '#EEEEEE' : null;
        }
    };

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
     * Define the pdfmake virtual file system, adding the fonts
     *
     * @returns the vfs-object
     */
    private async initVfs(): Promise<object> {
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
        const binaryDataUrls = await Promise.all(promises);
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
    private async convertUrlToBase64(url: string): Promise<string> {
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
     * @param imageUrls Array of optional images (url, placeholder) to be inserted
     * @param customMargins optionally overrides the margins
     * @param landscape optional landscape page orientation instead of default portrait
     * @returns the pdf document definition ready to export
     */
    private async getStandardPaper(
        documentContent: object,
        metadata?: object,
        imageUrls?: string[],
        customMargins?: [number, number, number, number],
        landscape?: boolean
    ): Promise<object> {
        this.initFonts();
        this.imageUrls = imageUrls ? imageUrls : [];
        pdfMake.vfs = await this.initVfs();
        const pageSize = this.configService.instant('general_export_pdf_pagesize');
        const defaultMargins = pageSize === 'A5' ? [45, 30, 45, 45] : [75, 90, 75, 75];
        // needs to be done before, cause the footer is async
        this.loadFooterImages();
        const result = {
            pageSize: pageSize || 'A4',
            pageOrientation: landscape ? 'landscape' : 'portrait',
            pageMargins: customMargins || defaultMargins,
            defaultStyle: {
                font: 'PdfFont',
                fontSize: this.configService.instant('general_export_pdf_fontsize')
            },
            header: this.getHeader(customMargins ? [customMargins[0], customMargins[2]] : null),
            // TODO: option for no footer, wherever this can be defined
            footer: (currentPage, pageCount) => {
                return this.getFooter(
                    currentPage,
                    pageCount,
                    customMargins ? [customMargins[0], customMargins[2]] : null
                );
            },
            info: metadata,
            content: documentContent,
            styles: this.getStandardPaperStyles()
        };
        await this.loadAllImages();
        return result;
    }

    /**
     * Overall document definition and styles for blank PDF documents
     * (e.g. ballots)
     *
     * @param documentContent the content of the pdf as object
     * @param imageUrl an optional image to insert into the ballot
     * @returns the pdf document definition ready to export
     */
    private async getBallotPaper(documentContent: object, imageUrl?: string): Promise<object> {
        this.initFonts();
        this.imageUrls = imageUrl ? [imageUrl] : [];
        pdfMake.vfs = await this.initVfs();
        const result = {
            pageSize: 'A4',
            pageMargins: [0, 0, 0, 0],
            defaultStyle: {
                font: 'PdfFont',
                fontSize: 10
            },
            content: documentContent,
            styles: this.getBlankPaperStyles()
        };
        await this.loadAllImages();
        return result;
    }

    /**
     * Define the fonts
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
     * @param lrMargin optional margin overrides
     * @returns an object that contains the necessary header definition
     */
    private getHeader(lrMargin?: [number, number]): object {
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
            this.imageUrls.push(logoHeaderLeftUrl);
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
            this.imageUrls.push(logoHeaderRightUrl);
        }
        const margin = [lrMargin ? lrMargin[0] : 75, 30, lrMargin ? lrMargin[0] : 75, 10];
        // pdfmake order: [left, top, right, bottom]

        return {
            color: '#555',
            fontSize: 9,
            margin: margin,
            columns: columns,
            columnGap: 10
        };
    }

    /**
     * Creates the footer doc definition for normal PDF documents.
     * Adds page numbers into the footer
     *
     * @param currentPage holds the number of the current page
     * @param pageCount holds the page count
     * @param lrMargin optionally overriding the margins
     * @returns the footer doc definition
     */
    private getFooter(currentPage: number, pageCount: number, lrMargin?: [number, number]): object {
        const columns = [];
        let logoContainerWidth: string;
        let pageNumberPosition: string;
        let logoContainerSize: number[];
        const logoFooterLeftUrl = this.configService.instant<any>('logo_pdf_footer_L').path;
        const logoFooterRightUrl = this.configService.instant<any>('logo_pdf_footer_R').path;

        // if there is a single logo, give it a lot of space
        if (logoFooterLeftUrl && logoFooterRightUrl) {
            logoContainerWidth = '20%';
            logoContainerSize = [180, 40];
        } else {
            logoContainerWidth = '80%';
            logoContainerSize = [400, 50];
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
            columns.push({
                image: logoFooterLeftUrl,
                fit: logoContainerSize,
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
            columns.push({
                image: logoFooterRightUrl,
                fit: logoContainerSize,
                width: logoContainerWidth,
                alignment: 'right'
            });
        }

        const margin = [lrMargin ? lrMargin[0] : 75, 0, lrMargin ? lrMargin[0] : 75, 10];
        return {
            margin: margin,
            columns: columns,
            columnGap: 10
        };
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
     * Downloads a pdf in landscape orientation
     *
     * @param docDefinition the structure of the PDF document
     * @param filename the name of the file to use
     * @param metadata
     */
    public downloadLandscape(docDefinition: object, filename: string, metadata?: object): void {
        this.getStandardPaper(docDefinition, metadata, null, [50, 80, 50, 75], true).then(doc => {
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
        this.getBallotPaper(docDefinition, logo).then(doc => {
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
        pdfMake.createPdf(doc).getBlob(blob => {
            saveAs(blob, `${filename}.pdf`, { autoBOM: true });
        });
    }

    /**
     * Definition of styles for standard papers
     *
     * @returns an object that contains all pdf styles
     */
    private getStandardPaperStyles(): object {
        const pageSize = this.configService.instant('general_export_pdf_pagesize');
        return {
            title: {
                fontSize: pageSize === 'A5' ? 14 : 16,
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
                fontSize: pageSize === 'A5' ? 12 : 14,
                margin: [0, 0, 0, 10],
                bold: true
            },
            heading3: {
                fontSize: pageSize === 'A5' ? 10 : 12,
                margin: [0, 10, 0, 0],
                bold: true
            },
            userDataHeading: {
                fontSize: 14,
                margin: [0, 10],
                bold: true
            },
            userDataTopic: {
                fontSize: 12,
                margin: [0, 5]
            },
            userDataValue: {
                fontSize: 12,
                margin: [15, 5]
            },
            tocEntry: {
                fontSize: pageSize === 'A5' ? 10 : 11,
                margin: [0, 0, 0, 0],
                bold: false
            },
            tocHeaderRow: {
                fontSize: 8,
                italics: true
            },
            tocSubEntry: {
                fontSize: pageSize === 'A5' ? 9 : 10,
                color: '#404040'
            },
            tocCategoryEntry: {
                fontSize: pageSize === 'A5' ? 10 : 11,
                margin: [10, 0, 0, 0],
                bold: false
            },
            tocCategoryTitle: {
                fontSize: pageSize === 'A5' ? 10 : 11,
                margin: [0, 0, 0, 4],
                bold: true
            },
            tocCategorySection: {
                margin: [0, 0, 0, 10]
            },
            userDataTitle: {
                fontSize: 26,
                margin: [0, 0, 0, 0],
                bold: true
            },
            tableHeader: {
                bold: true,
                fillColor: 'white'
            },
            listParent: {
                fontSize: 14,
                margin: [0, 5]
            },
            listChild: {
                fontSize: 12,
                margin: [0, 5]
            },
            textItem: {
                fontSize: 11,
                margin: [0, 7]
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

    /**
     * Adds the footer images to the imageUrls-list, cause the create footer function is async and
     * potentially called after loadAllImages was called.
     */
    private loadFooterImages(): void {
        const logoFooterLeftUrl = this.configService.instant<any>('logo_pdf_footer_L').path;
        const logoFooterRightUrl = this.configService.instant<any>('logo_pdf_footer_R').path;

        if (logoFooterLeftUrl) {
            this.imageUrls.push(logoFooterLeftUrl);
        }

        if (logoFooterRightUrl) {
            this.imageUrls.push(logoFooterRightUrl);
        }
    }

    /**
     * Triggers the addition of all images found during creation(including header and footer)
     * to the vfs.
     */
    private async loadAllImages(): Promise<void> {
        const promises = this.imageUrls.map(image => {
            return this.addImageToVfS(image);
        });
        await Promise.all(promises);
    }

    /**
     * Creates an image in the pdfMake virtual file system, if it doesn't yet exist there
     *
     * @param url
     */
    private async addImageToVfS(url: string): Promise<void> {
        if (url.indexOf('/') === 0) {
            url = url.substr(1);
        }

        if (!pdfMake.vfs[url]) {
            const base64 = await this.convertUrlToBase64(url);
            pdfMake.vfs[url] = base64;
        }
    }

    /**
     * Creates the title for the motion list as pdfmake doc definition
     *
     * @returns The motion list title for the PDF document
     */
    public createTitle(configVariable: string): object {
        const titleText = this.translate.instant(this.configService.instant<string>(configVariable));

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
    public createPreamble(configVariable: string): object {
        const preambleText = this.configService.instant<string>(configVariable);

        if (preambleText) {
            return {
                text: preambleText,
                style: 'preamble'
            };
        } else {
            return {};
        }
    }

    public getPageBreak(): Object {
        return {
            text: '',
            pageBreak: 'after'
        };
    }

    /**
     * Generates the table definition for the TOC
     *
     * @param tocBody the body of the table
     * @returns The table of contents as doc definition
     */
    public createTocTableDef(
        tocBody: object[],
        style: StyleType = StyleType.DEFAULT,
        borderStyle: BorderType = BorderType.DEFAULT,
        ...header: object[]
    ): object {
        return {
            table: {
                headerRows: header[0] ? header.length : 0,
                keepWithHeaderRows: header[0] ? header.length : 0,
                dontBreakRows: true,
                widths: ['auto', '*', 'auto'],
                body: header[0] ? [...header, ...tocBody] : tocBody
            },
            layout: borderStyle,
            style: style
        };
    }

    /**
     * Function, that creates a line for the 'Table of contents'
     *
     * @param identifier The identifier/prefix for the line
     * @param title The name of the line
     * @param pageReference Defaults to the page, where the object begins
     * @param style Optional style. Defaults to `'tocEntry'`
     *
     * @returns A line for the toc
     */
    public createTocLine(
        identifier: string,
        title: string,
        pageReference: string,
        style: StyleType = StyleType.DEFAULT,
        ...subTitle: object[]
    ): Array<Object> {
        return [
            {
                text: identifier,
                style: style
            },
            {
                text: [title, ...subTitle],
                style: 'tocEntry'
            },
            {
                pageReference: pageReference,
                style: 'tocEntry',
                alignment: 'right'
            }
        ];
    }

    /**
     * Function to create an inline line in the toc.
     *
     * @param text The text for the line.
     * @param bold Optional boolean, if the text should be bold - defaults to `false`.
     *
     * @returns {Object} An object for `DocDefinition` for `pdf-make`.
     */
    public createTocLineInline(text: string): Object {
        return {
            text: '\n' + text,
            style: StyleType.SUB_ENTRY
        };
    }
}
