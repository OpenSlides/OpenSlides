import { Component } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

import { AgendaImportService } from '../../agenda-import.service';
import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { DurationService } from 'app/core/ui-services/duration.service';
import { FileExportService } from 'app/core/ui-services/file-export.service';
import { itemVisibilityChoices } from 'app/shared/models/agenda/item';
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
        private exporter: FileExportService,
        private durationService: DurationService
    ) {
        super(importer, titleService, translate, matSnackBar);
        this.textAreaForm = formBuilder.group({ inputtext: [''] });
    }

    /**
     * Get the first characters of a string, for preview purposes
     *
     * @param input any string
     * @returns a string with at most 50 characters
     */
    public getShortPreview(input: string): string {
        if (!input) {
            return '';
        }
        if (input.length > 50) {
            return this.stripHtmlTags(input.substring(0, 47)) + '...';
        }
        return this.stripHtmlTags(input);
    }

    /**
     * Fetch the first and last 150 characters of a string; used within
     * tooltips for the preview
     *
     * @param input any string
     * @returns a string with the first and last 150 characters of the input
     * string
     */
    public getLongPreview(input: string): string {
        if (!input) {
            return '';
        }
        if (input.length < 300) {
            return this.stripHtmlTags(input);
        }
        return (
            this.stripHtmlTags(input.substring(0, 147)) +
            ' [...] ' +
            this.stripHtmlTags(input.substring(input.length - 150, input.length))
        );
    }

    /**
     * Helper to remove html tags from a string.
     * CAUTION: It is just a basic "don't show distracting html tags in a
     * preview", not an actual tested sanitizer!
     *
     * @param inputString
     * @returns a string without hatml tags
     */
    private stripHtmlTags(inputString: string): string {
        const regexp = new RegExp(/<[^ ][^<>]*(>|$)/g);
        return inputString.replace(regexp, '').trim();
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        const headerRow = ['Title', 'Text', 'Duration', 'Comment', 'Internal item']
            .map(item => this.translate.instant(item))
            .join(',');
        const rows = [
            headerRow,
            'Demo 1,Demo text 1,1:00,test comment,',
            'Break,,0:10,,internal',
            'Demo 2,Demo text 2,1:30,,hidden'
        ];
        this.exporter.saveFile(rows.join('\n'), this.translate.instant('Topic example') + '.csv', 'text/csv');
    }

    /**
     * Fetches the string to a item_type
     *
     * @param type
     * @returns A string, which may be empty if the type is not found in the visibilityChoices
     */
    public getTypeString(type: number): string {
        const visibility = itemVisibilityChoices.find(choice => choice.key === type);
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
            return this.durationService.durationToString(duration);
        } else {
            return '';
        }
    }
}
