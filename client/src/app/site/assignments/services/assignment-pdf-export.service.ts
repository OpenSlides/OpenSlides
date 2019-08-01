import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { PdfDocumentService, PdfError } from 'app/core/pdf-services/pdf-document.service';
import { AssignmentPdfService } from './assignment-pdf.service';
import { ViewAssignment } from '../models/view-assignment';

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
        const filename = `${this.translate.instant('Election')}_${assignment.title}`;
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }

    /**
     * Generates a pdf document for a list of assignments
     *
     * @param assignments The list of assignments that should be exported as pdf.
     */
    public exportMultipleAssignments(assignments: ViewAssignment[]): void {
        const doc = this.createDocOfMultipleAssignments(assignments);

        const filename = this.translate.instant('Elections');
        const metaData = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metaData);
    }

    /**
     * Helper to generate from a list of assignments a document for the pdf export.
     *
     * @param assignments The list of assignments
     *
     * @returns doc definition as object
     */
    private createDocOfMultipleAssignments(assignments: ViewAssignment[]): object {
        const doc = [];
        const fileList = assignments.map((assignment, index) => {
            try {
                const assignmentDocDef = this.assignmentPdfService.assignmentToDocDef(assignment);
                assignmentDocDef[0].id = `${assignment.id}`;
                return index < assignments.length - 1
                    ? [assignmentDocDef, this.pdfDocumentService.getPageBreak()]
                    : [assignmentDocDef];
            } catch (error) {
                const errorText = `${this.translate.instant('Error during PDF creation of election:')} ${
                    assignment.title
                }`;
                console.error(`${errorText}\nDebugInfo:\n`, error);
                throw new PdfError(errorText);
            }
        });

        if (assignments.length > 1) {
            doc.push(
                this.pdfDocumentService.createTitle('assignments_pdf_title'),
                this.pdfDocumentService.createPreamble('assignments_pdf_preamble'),
                this.createToc(assignments)
            );
        }

        doc.push(fileList);
        return doc;
    }

    /**
     * Function to create the 'Table of contents'
     *
     * @param assignments All the assignments, who should be exported as PDF.
     *
     * @returns The toc as
     */
    private createToc(assignments: ViewAssignment[]): Object {
        const toc = [];
        const tocTitle = {
            text: this.translate.instant('Table of contents'),
            style: 'heading2'
        };

        const tocBody = assignments.map((assignment, index) =>
            this.pdfDocumentService.createTocLine(`${index + 1}`, assignment.title, `${assignment.id}`)
        );
        toc.push(this.pdfDocumentService.createTocTableDef(tocBody));

        return [tocTitle, toc, this.pdfDocumentService.getPageBreak()];
    }
}
