import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ErrorService } from 'app/core/ui-services/error.service';
import { StatuteParagraph } from 'app/shared/models/motions/statute-paragraph';
import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { StatuteCsvExportService } from 'app/site/motions/services/statute-csv-export.service';
import { StatuteImportService } from 'app/site/motions/services/statute-import.service';

/**
 * Component for the statute paragraphs import list view.
 */
@Component({
    selector: 'os-statute-import-list',
    templateUrl: './statute-import-list.component.html'
})
export class StatuteImportListComponent extends BaseImportListComponent<StatuteParagraph> {
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
        errorService: ErrorService,
        importer: StatuteImportService,
        private statuteCSVExport: StatuteCsvExportService
    ) {
        super(titleService, translate, matSnackBar, errorService, importer);
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        this.statuteCSVExport.exportDummyCSV();
    }
}
