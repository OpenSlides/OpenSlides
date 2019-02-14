import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { MotionCsvExportService } from '../../services/motion-csv-export.service';
import { MotionImportService } from '../../services/motion-import.service';
import { ViewMotion } from '../../models/view-motion';
import { stripHtmlTags } from 'app/shared/utils/strip-html-tags';

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
        this.motionCSVExport.exportDummyMotion();
    }
}
