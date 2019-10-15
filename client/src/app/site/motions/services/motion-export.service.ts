import { Injectable } from '@angular/core';

import { PdfError } from 'app/core/pdf-services/pdf-document.service';
import { MotionCsvExportService } from './motion-csv-export.service';
import { MotionPdfExportService } from './motion-pdf-export.service';
import { MotionXlsxExportService } from './motion-xlsx-export.service';
import { ChangeRecoMode, ExportFileFormat, InfoToExport, LineNumberingMode } from '../motions.constants';
import { ViewMotion } from '../models/view-motion';

/**
 * Shape the structure of the dialog data
 */
export interface MotionExportInfo {
    format?: ExportFileFormat;
    lnMode?: LineNumberingMode;
    crMode?: ChangeRecoMode;
    content?: string[];
    metaInfo?: InfoToExport[];
    pdfOptions?: string[];
    comments?: number[];
}

/**
 * Generic layer to unify any motion export
 */
@Injectable({
    providedIn: 'root'
})
export class MotionExportService {
    public constructor(
        private pdfExport: MotionPdfExportService,
        private csvExport: MotionCsvExportService,
        private xlsxExport: MotionXlsxExportService
    ) {}

    public evaluateExportRequest(exportInfo: MotionExportInfo, data: ViewMotion[]): void {
        if (!exportInfo) {
            return;
        }
        if (exportInfo.format) {
            if (exportInfo.format === ExportFileFormat.PDF) {
                try {
                    this.pdfExport.exportMotionCatalog(data, exportInfo);
                } catch (err) {
                    if (err instanceof PdfError) {
                        console.error('PDFError: ', err);
                        /**
                         * TODO: Has been this.raiseError(err.message) before. Central error treatment
                         */
                    } else {
                        throw err;
                    }
                }
            } else if (exportInfo.format === ExportFileFormat.CSV) {
                const content = [];
                const comments = [];
                if (exportInfo.content) {
                    content.push(...exportInfo.content);
                }
                if (exportInfo.metaInfo) {
                    content.push(...exportInfo.metaInfo);
                }
                if (exportInfo.comments) {
                    comments.push(...exportInfo.comments);
                }
                this.csvExport.exportMotionList(data, content, comments, exportInfo.crMode);
            } else if (exportInfo.format === ExportFileFormat.XLSX) {
                this.xlsxExport.exportMotionList(data, exportInfo.metaInfo, exportInfo.comments);
            }
        } else {
            throw new Error('No export format was provided');
        }
    }
}
