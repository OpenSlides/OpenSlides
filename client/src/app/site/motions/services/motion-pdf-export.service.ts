import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { MotionPdfService } from './motion-pdf.service';
import { PdfDocumentService } from 'app/core/services/pdf-document.service';
import { ViewMotion, LineNumberingMode, ChangeRecoMode } from '../models/view-motion';

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
     * @param motionPdfService Converting actual motions to PDF
     * @param pdfDocumentService Actual pdfmake functions and global doc definitions
     */
    public constructor(
        private translate: TranslateService,
        private motionPdfService: MotionPdfService,
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
}
