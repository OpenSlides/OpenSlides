import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { ViewStatuteParagraph } from 'app/site/motions/models/view-statute-paragraph';
import { StatuteImportService } from 'app/site/motions/services/statute-import.service';
import { StatuteCsvExportService } from 'app/site/motions/services/statute-csv-export.service';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';

/**
 * Component for the statute paragraphs import list view.
 */
@Component({
    selector: 'os-statute-import-list',
    templateUrl: './statute-import-list.component.html'
})
export class StatuteImportListComponent extends BaseImportListComponent<ViewStatuteParagraph> {
    /**
     * Constructor for list view bases
     *
     * @param titleService the title serivce
     * @param matSnackBar snackbar for displaying errors
     * @param translate the translate service
     * @param importer: The statute csv import service
     * @param statuteCSVExport: service for exporting example data
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        importer: StatuteImportService,
        private statuteCSVExport: StatuteCsvExportService
    ) {
        super(importer, titleService, translate, matSnackBar);
    }

    /**
     * Returns the first characters of a string, for preview purposes
     *
     * @param input
     */
    public getShortPreview(input: string): string {
        if (input.length > 50) {
            return stripHtmlTags(input.substring(0, 47)) + '...';
        }
        return stripHtmlTags(input);
    }

    /**
     * Returns the first and last 150 characters of a string; used within
     * tooltips for the preview
     *
     * @param input
     */
    public getLongPreview(input: string): string {
        if (input.length < 300) {
            return stripHtmlTags(input);
        }
        return (
            stripHtmlTags(input.substring(0, 147)) +
            ' [...] ' +
            stripHtmlTags(input.substring(input.length - 150, input.length))
        );
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        this.statuteCSVExport.exportDummyCSV();
    }
}
