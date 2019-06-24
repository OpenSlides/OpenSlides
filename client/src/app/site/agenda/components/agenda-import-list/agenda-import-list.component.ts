import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { AgendaImportService } from '../../agenda-import.service';
import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { CsvExportService } from 'app/core/ui-services/csv-export.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { ItemVisibilityChoices } from 'app/shared/models/agenda/item';
import { ViewCreateTopic } from '../../models/view-create-topic';

/**
 * Component for the agenda import list view.
 */
@Component({
    selector: 'os-agenda-import-list',
    templateUrl: './agenda-import-list.component.html'
})
export class AgendaImportListComponent extends BaseImportListComponent<ViewCreateTopic> {
    /**
     * A form for text input
     */
    public textAreaForm: FormGroup;

    /**
     * Constructor for list view bases
     *
     * @param titleService the title serivce
     * @param matSnackBar snackbar for displaying errors
     * @param translate the translate service
     * @param importer: The agenda csv import service
     * @param formBuilder: FormBuilder for the textarea
     * @param exporter: ExportService for example download
     * @param durationService: Service converting numbers to time strings
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        translate: TranslateService,
        importer: AgendaImportService,
        formBuilder: FormBuilder,
        private exporter: CsvExportService,
        private durationService: DurationService
    ) {
        super(importer, titleService, translate, matSnackBar);
        this.textAreaForm = formBuilder.group({ inputtext: [''] });
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        const headerRow = ['Title', 'Text', 'Duration', 'Comment', 'Internal item'];
        const rows = [
            ['Demo 1', 'Demo text 1', '1:00', 'test comment', null],
            ['Break', null, '0:10', null, 'internal', null],
            ['Demo 2', 'Demo text 2', '1:30', null, 'hidden']
        ];
        this.exporter.dummyCSVExport(
            headerRow,
            rows,
            `${this.translate.instant('Agenda')}-${this.translate.instant('example')}.csv`
        );
    }

    /**
     * Fetches the string to a item_type
     *
     * @param type
     * @returns A string, which may be empty if the type is not found in the visibilityChoices
     */
    public getTypeString(type: number): string {
        const visibility = ItemVisibilityChoices.find(choice => choice.key === type);
        return visibility ? visibility.name : '';
    }

    /**
     * Sends the data in the text field input area to the importer
     */
    public parseTextArea(): void {
        (this.importer as AgendaImportService).parseTextArea(this.textAreaForm.get('inputtext').value);
    }

    /**
     * Triggers a change in the tab group: Clearing the preview selection
     */
    public onTabChange(): void {
        this.importer.clearPreview();
    }

    /**
     * Gets a readable string for a duration
     *
     * @param duration
     * @returns a duration string, an empty string if the duration is not set or negative
     */
    public getDuration(duration: number): string {
        if (duration >= 0) {
            return this.durationService.durationToString(duration, 'h');
        } else {
            return '';
        }
    }
}
