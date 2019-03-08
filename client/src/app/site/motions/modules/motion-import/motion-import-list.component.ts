import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { MotionCsvExportService } from 'app/site/motions/services/motion-csv-export.service';
import { MotionImportService } from 'app/site/motions/services/motion-import.service';
import { ViewMotion } from 'app/site/motions/models/view-motion';

/**
 * Component for the motion import list view.
 */
@Component({
    selector: 'os-motion-import-list',
    templateUrl: './motion-import-list.component.html'
})
export class MotionImportListComponent extends BaseImportListComponent<ViewMotion> {
    /**
     * Constructor for list view bases
     *
     * @param titleService the title serivce
     * @param matSnackBar snackbar for displaying errors
     * @param translate the translate service
     * @param importer: The motion csv import service
     * @param motionCSVExport: service for exporting example data
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        importer: MotionImportService,
        private motionCSVExport: MotionCsvExportService
    ) {
        super(importer, titleService, translate, matSnackBar);
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        this.motionCSVExport.exportDummyMotion();
    }
}
