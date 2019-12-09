import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { NewEntry } from 'app/core/ui-services/base-import.service';
import { CsvExportService } from 'app/core/ui-services/csv-export.service';
import { ErrorService } from 'app/core/ui-services/error.service';
import { User } from 'app/shared/models/users/user';
import { BaseImportListComponent } from 'app/site/base/base-import-list';
import { UserImportService } from '../../services/user-import.service';

/**
 * Component for the user import list view.
 */
@Component({
    selector: 'os-user-import-list',
    templateUrl: './user-import-list.component.html'
})
export class UserImportListComponent extends BaseImportListComponent<User> {
    public textAreaForm: FormGroup;

    /**
     * Constructor for list view bases
     *
     * @param titleService the title serivce
     * @param matSnackBar snackbar for displaying errors
     * @param formBuilder: FormBuilder for the textArea
     * @param translate the translate service
     * @param exporter: csv export service for dummy data
     * @param importer: The motion csv import service
     */
    public constructor(
        titleService: Title,
        public translate: TranslateService,
        matSnackBar: MatSnackBar,
        errorService: ErrorService,
        importer: UserImportService,
        formBuilder: FormBuilder,
        private exporter: CsvExportService
    ) {
        super(titleService, translate, matSnackBar, errorService, importer);
        this.textAreaForm = formBuilder.group({ inputtext: [''] });
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        const headerRow = [
            'Title',
            'Given name',
            'Surname',
            'Structure level',
            'Participant number',
            'Groups',
            'Comment',
            'Is active',
            'Is present',
            'Is a committee',
            'Initial password',
            'Email',
            'Username',
            'Gender'
        ];
        const rows = [
            [
                'Dr.',
                'Max',
                'Mustermann',
                'Berlin',
                1234567890,
                'Delegates, Staff',
                'xyz',
                1,
                1,
                ,
                'initialPassword',
                null,
                'mmustermann',
                'm'
            ],
            [
                null,
                'John',
                'Doe',
                'Washington',
                '75/99/8-2',
                'Committees',
                'This is a comment, without doubt',
                1,
                1,
                null,
                null,
                'john.doe@email.com',
                'jdoe',
                'diverse'
            ],
            [null, 'Julia', 'Bloggs', 'London', null, null, null, null, null, null, null, null, 'jbloggs', 'f'],
            [null, null, 'Executive Board', null, null, null, null, null, null, 1, null, null, 'executive', null]
        ];
        this.exporter.dummyCSVExport(headerRow, rows, `${this.translate.instant('participants-example')}.csv`);
    }

    /**
     * Shorthand for getVerboseError on name fields checking for duplicates and invalid fields
     *
     * @param row
     * @returns an error string similar to getVerboseError
     */
    public nameErrors(row: NewEntry<User>): string {
        for (const name of ['NoName', 'Duplicates', 'DuplicateImport']) {
            if (this.importer.hasError(row, name)) {
                return this.importer.verbose(name);
            }
        }
        return '';
    }

    /**
     * Sends the data in the text field input area to the importer
     */
    public parseTextArea(): void {
        (this.importer as UserImportService).parseTextArea(this.textAreaForm.get('inputtext').value);
    }

    /**
     * Triggers a change in the tab group: Clearing the preview selection
     */
    public onTabChange(): void {
        this.importer.clearPreview();
    }
}
