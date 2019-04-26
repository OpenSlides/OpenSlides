import { Injectable } from '@angular/core';
import { ViewAssignment } from '../models/view-assignment';
import { AssignmentPdfService } from './assignment-pdf.service';
import { TranslateService } from '@ngx-translate/core';
import { PdfDocumentService } from 'app/core/ui-services/pdf-document.service';

/**
 * Controls PDF export for assignments
 */
@Injectable({
    providedIn: 'root'
})
export class AssignmentPdfExportService {
    /**
     * Constructor
     *
     * @param translate Translate
     * @param assignmentPdfService Service for single assignment details
     * @param pdfDocumentService Service for PDF document generation
     */
    public constructor(
        private translate: TranslateService,
        private assignmentPdfService: AssignmentPdfService,
        private pdfDocumentService: PdfDocumentService
    ) {}

    /**
     * Generates an pdf out of a given assignment and saves it as file
     *
     * @param assignment the assignment to export
     */
    public exportSingleAssignment(assignment: ViewAssignment): void {
        const doc = this.assignmentPdfService.assignmentToDocDef(assignment);
        const filename = `${this.translate.instant('Assignments')} ${assignment.title}`;
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }
}
