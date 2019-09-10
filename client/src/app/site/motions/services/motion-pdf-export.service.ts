import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { AmendmentListPdfService } from './amendment-list-pdf.service';
import { PdfDocumentService } from 'app/core/pdf-services/pdf-document.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { PersonalNoteContent } from 'app/shared/models/users/personal-note';
import { MotionExportInfo } from './motion-export.service';
import { MotionPdfCatalogService } from './motion-pdf-catalog.service';
import { MotionPdfService } from './motion-pdf.service';
import { ViewMotion } from '../models/view-motion';
import { ViewMotionCommentSection } from '../models/view-motion-comment-section';

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
        private amendmentListPdfService: AmendmentListPdfService,
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
    public exportSingleMotion(motion: ViewMotion, exportInfo?: MotionExportInfo): void {
        const doc = this.motionPdfService.motionToDocDef(motion, exportInfo);
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
     * @param commentsToExport Comments (by id) to export
     */
    public exportMotionCatalog(motions: ViewMotion[], exportInfo: MotionExportInfo): void {
        const doc = this.pdfCatalogService.motionListToDocDef(motions, exportInfo);
        const motions_export_title = this.configService.instant<string>('motions_export_title');
        const filename = this.translate.instant(motions_export_title);
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata, exportInfo);
    }

    /**
     * Exports a table of the motions in order of their call list
     *
     * @param motions the motions to export
     */
    public exportPdfCallList(motions: ViewMotion[]): void {
        const doc = this.motionPdfService.callListToDoc(motions);
        const filename = this.translate.instant('Call list');
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.downloadLandscape(doc, filename, metadata);
    }

    /**
     * Exports the given personalNote with some short information about the
     * motion the note refers to
     *
     * @param note
     * @param motion
     */
    public exportPersonalNote(note: PersonalNoteContent, motion: ViewMotion): void {
        const doc = this.motionPdfService.textToDocDef(note.note, motion, 'Personal note');
        const filename = `${motion.identifierOrTitle} - ${this.translate.instant('Personal note')}`;
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.download(doc, filename, metadata);
    }

    /**
     * Exports the given comment with some short information about the
     * motion the note refers to
     *
     * @param comment
     * @param motion
     */
    public exportComment(comment: ViewMotionCommentSection, motion: ViewMotion): void {
        const motionComment = motion.getCommentForSection(comment);
        if (motionComment && motionComment.comment) {
            const doc = this.motionPdfService.textToDocDef(motionComment.comment, motion, comment.name);
            const filename = `${motion.identifierOrTitle} - ${comment.name}`;
            const metadata = { title: filename };
            this.pdfDocumentService.download(doc, filename, metadata);
        }
    }

    /**
     * Exports the amendments to the given motion as an overview table
     * @param parentMotion
     */
    public exportAmendmentList(amendments: ViewMotion[], parentMotion?: ViewMotion): void {
        let filename: string;
        if (parentMotion) {
            filename = `${this.translate.instant('Amendments to')} ${parentMotion.getListTitle()}`;
        } else {
            filename = `${this.translate.instant('Amendments')}`;
        }
        const doc = this.amendmentListPdfService.overviewToDocDef(filename, amendments);
        const metadata = {
            title: filename
        };
        this.pdfDocumentService.downloadLandscape(doc, filename, metadata);
    }
}
