import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ErrorService } from 'app/core/ui-services/error.service';
import { Motion } from 'app/shared/models/motions/motion';
import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { MotionCsvExportService } from 'app/site/motions/services/motion-csv-export.service';
import { MotionImportService } from 'app/site/motions/services/motion-import.service';

/**
 * Component for the motion import list view.
 */
@Component({
    selector: 'os-motion-import-list',
    templateUrl: './motion-import-list.component.html'
})
export class MotionImportListComponent extends BaseImportListComponent<Motion> {
    /**
     * Fetach a list of the headers expected by the importer, and prepare them
     * to be translateable (upper case)
     *
     * @returns a list of strings matching the expected headers
     */
    public get expectedHeader(): string[] {
        return this.importer.expectedHeader.map(header => {
            if (header === 'motion_block') {
                return 'Motion block';
            } else {
                return header.charAt(0).toUpperCase() + header.slice(1);
            }
        });
    }

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
        errorService: ErrorService,
        importer: MotionImportService,
        private motionCSVExport: MotionCsvExportService
    ) {
        super(titleService, translate, matSnackBar, errorService, importer);
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        this.motionCSVExport.exportDummyMotion();
    }
}
