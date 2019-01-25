import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { MotionPdfService } from './motion-pdf.service';
import { PdfDocumentService } from 'app/core/services/pdf-document.service';
import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';
import { ConfigService } from 'app/core/services/config.service';
import { MotionPdfCatalogService } from './motion-pdf-catalog.service';

/**
 * Export service to handle various kind of exporting necessities.
 */
@Injectable({
    providedIn: 'root'
})
export class MotionPdfExportService {
    /**
     * Constructor
     *
     * @param translate handle translations
     * @param configService Read out Config variables
     * @param motionPdfService Converting actual motions to PDF
     * @param pdfDocumentService Actual pdfmake functions and global doc definitions
     */
    public constructor(
        private translate: TranslateService,
        private configService: ConfigService,
        private motionPdfService: MotionPdfService,
        private pdfCatalogService: MotionPdfCatalogService,
        private pdfDocumentService: PdfDocumentService
    ) {}

    /**
     * Exports a single motions to PDF
     *
     * @param motion The motion to export
     * @param lnMode the desired line numbering mode
     * @param crMode the desired change recomendation mode
     */
    public exportSingleMotion(motion: ViewMotion, lnMode?: LineNumberingMode, crMode?: ChangeRecoMode): void {
        const doc = this.motionPdfService.motionToDocDef(motion, lnMode, crMode);
        const filename = `${this.translate.instant('Motion')} ${motion.identifierOrTitle}`;
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }

    /**
     * Exports multiple motions to a collection of PDFs
     *
     * @param motions the motions to export
     * @param lnMode lineNumbering Mode
     * @param crMode Change Recommendation Mode
     * @param contentToExport Determine to determine with text and/or reason
     * @param infoToExport Determine the meta info to export
     */
    public exportMotionCatalog(
        motions: ViewMotion[],
        lnMode?: LineNumberingMode,
        crMode?: ChangeRecoMode,
        contentToExport?: string[],
        infoToExport?: string[]
    ): void {
        const doc = this.pdfCatalogService.motionListToDocDef(motions, lnMode, crMode, contentToExport, infoToExport);
        const filename = this.translate.instant(this.configService.instant<string>('motions_export_title'));
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }
}
