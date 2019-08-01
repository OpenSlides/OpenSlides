import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { PdfDocumentService } from 'app/core/pdf-services/pdf-document.service';
import { UserPdfService } from './user-pdf.service';
import { ViewUser } from '../models/view-user';

/**
 * Export service to handle various kind of exporting necessities for participants.
 */
@Injectable({
    providedIn: 'root'
})
export class UserPdfExportService {
    /**
     * Constructor
     *
     * @param translate TranslateService - handle translations
     * @param userPdfService UserPdfService - convert users to PDF
     * @param pdfDocumentService PdfDocumentService Actual pdfmake functions and global doc definitions
     */
    public constructor(
        private translate: TranslateService,
        private userPdfService: UserPdfService,
        private pdfDocumentService: PdfDocumentService
    ) {}

    /**
     * Exports a single user with access information to PDF
     *
     * @param user The user to export
     */
    public exportSingleUserAccessPDF(user: ViewUser): void {
        const doc = this.userPdfService.userAccessToDocDef(user);
        const filename = `${this.translate.instant('Access-data')} ${user.short_name}`;
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }

    /**
     * Exports multiple users with access information to a collection of PDFs
     *
     * @param Users
     */
    public exportMultipleUserAccessPDF(users: ViewUser[]): void {
        const doc: object[] = [];
        users.forEach(user => {
            doc.push(this.userPdfService.userAccessToDocDef(user));
            doc.push({ text: '', pageBreak: 'after' });
        });
        const filename = this.translate.instant('Access-data');
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }

    /**
     * Export a participant list
     * @param users: The users to appear on that list
     *
     */
    public exportUserList(users: ViewUser[]): void {
        const filename = this.translate.instant('List of participants');
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(this.userPdfService.createUserListDocDef(users), filename, metadata);
    }
}
