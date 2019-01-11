import { MatTableDataSource, MatTable, MatSnackBar, MatSelectChange } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewChild, Component, OnInit } from '@angular/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { NewEntry, ValueLabelCombination } from 'app/core/services/text-import.service';
import { ViewUser } from '../../models/view-user';
import { UserImportService } from '../../services/user-import.service';
import { FileExportService } from 'app/core/services/file-export.service';

/**
 * Component for the user import list view.
 */
@Component({
    selector: 'os-user-import-list',
    templateUrl: './user-import-list.component.html',
    styleUrls: ['./user-import-list.component.scss']
})
export class UserImportListComponent extends BaseViewComponent implements OnInit {
    /**
     * The data source for a table. Requires to be initialised with a BaseViewModel
     */
    public dataSource: MatTableDataSource<NewEntry<ViewUser>>;

    /**
     * Switch that turns true if a file has been selected in the input
     */
    public hasFile = false;

    /**
     * Currently selected encoding. Is set and changed by the config's available
     * encodings and user mat-select input
     */
    public selectedEncoding = 'utf-8';

    /**
     * indicator on which elements to display
     */
    public shown: 'all' | 'error' | 'noerror' = 'all';

    /**
     * The table itself
     */
    @ViewChild(MatTable)
    protected table: MatTable<NewEntry<ViewUser>>;

    /**
     * Returns the amount of total item successfully parsed
     */
    public get totalCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.total : null;
    }

    /**
     * Returns the encodings available and their labels
     */
    public get encodings(): ValueLabelCombination[] {
        return this.importer.encodings;
    }

    /**
     * Returns the available column separators and their labels
     */
    public get columnSeparators(): ValueLabelCombination[] {
        return this.importer.columnSeparators;
    }

    /**
     * Returns the available text separators and their labels
     */
    public get textSeparators(): ValueLabelCombination[] {
        return this.importer.textSeparators;
    }

    /**
     * Returns the amount of import items that will be imported
     */
    public get newCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.new : 0;
    }

    /**
     * Returns the number of import items that cannot be imported
     */
    public get nonImportableCount(): number {
        if (this.importer && this.hasFile) {
            return this.importer.summary.errors + this.importer.summary.duplicates;
        }
        return 0;
    }

    /**
     * Returns the number of import items that have been successfully imported
     */
    public get doneCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.done : 0;
    }

    /**
     * Constructor for list view bases
     *
     * @param titleService the title serivce
     * @param matSnackBar snackbar for displaying errors
     * @param translate the translate service
     * @param importer: The motion csv import service
     * @param exporter: csv export service for dummy data
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        public translate: TranslateService,
        private importer: UserImportService,
        private exporter: FileExportService
    ) {
        super(titleService, translate, matSnackBar);
        this.initTable();
        this.importer.errorEvent.subscribe(this.raiseError);
    }

    /**
     * Starts with a clean preview (removing any previously existing import previews)
     */
    public ngOnInit(): void {
        this.importer.clearPreview();
    }

    /**
     * Initializes the table
     */
    public initTable(): void {
        this.dataSource = new MatTableDataSource();
        this.setFilter();
        this.importer.getNewEntries().subscribe(newEntries => {
            this.dataSource.data = newEntries;
            this.hasFile = newEntries.length > 0;
        });
    }

    /**
     * Returns the table column definition. Fetches all headers from
     * {@link MotionImportService} and an additional status column
     */
    public getColumnDefinition(): string[] {
        return ['status'].concat(this.importer.expectedHeader);
    }

    /**
     * triggers the importer's onSelectFile after a file has been chosen
     */
    public onSelectFile(event: any): void {
        this.importer.onSelectFile(event);
    }

    /**
     * Triggers the importer's import
     */
    public async doImport(): Promise<void> {
        await this.importer.doImport();
        this.setFilter();
    }

    /**
     * Updates and manually triggers the filter function.
     * See {@link hidden} for options
     * (changed from default mat-table filter)
     */
    public setFilter(): void {
        this.dataSource.filter = '';
        if (this.shown === 'all') {
            this.dataSource.filterPredicate = (data, filter) => {
                return true;
            };
        } else if (this.shown === 'noerror') {
            this.dataSource.filterPredicate = (data, filter) => {
                if (data.status === 'done') {
                    return true;
                } else if (data.status !== 'error') {
                    return true;
                }
            };
        } else if (this.shown === 'error') {
            this.dataSource.filterPredicate = (data, filter) => {
                if (data.errors.length || data.duplicates.length) {
                    return true;
                }
                return false;
            };
        }
        this.dataSource.filter = 'X'; // TODO: This is just a bogus non-null string to trigger the filter
    }

    /**
     * Returns the appropiate css class for a row according to the import state
     *
     * @param row
     */
    public getStateClass(row: NewEntry<ViewUser>): string {
        switch (row.status) {
            case 'done':
                return 'import-done import-decided';
            case 'error':
                return 'import-error';
            default:
                return '';
        }
    }

    /**
     * Return the icon for the action of the item
     * @param entry
     */
    public getActionIcon(entry: NewEntry<ViewUser>): string {
        switch (entry.status) {
            case 'error': // no import possible
                return 'block';
            case 'new': // new item, will be imported
                return 'playlist_add';
            case 'done': // item has been imported
                return 'done';
            default:
                // fallback: Error
                return 'block';
        }
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
            'Email'
        ]
            .map(item => this.translate.instant(item))
            .join(',');
        const rows = [
            headerRow,
            'Dr.,Max,Mustermann,"Berlin",1234567890,"Delegates, Staff",xyz,1,1,,initialPassword,',
            ',John,Doe,Washington,75/99/8-2,Committees,"This is a comment, without doubt",1,1,,,john.doe@email.com',
            ',Fred,Bloggs,London,,,,,,,,',
            ',,Executive Board,,,,,,,1,,'
        ];
        this.exporter.saveFile(rows.join('\n'), this.translate.instant('User example') + '.csv');
    }

    /**
     * Trigger for the column separator selection
     *
     * @param event
     */
    public selectColSep(event: MatSelectChange): void {
        this.importer.columnSeparator = event.value;
        this.importer.refreshFile();
    }

    /**
     * Trigger for the column separator selection
     *
     * @param event
     */
    public selectTextSep(event: MatSelectChange): void {
        this.importer.textSeparator = event.value;
        this.importer.refreshFile();
    }

    /**
     * Trigger for the encoding selection
     *
     * @param event
     */
    public selectEncoding(event: MatSelectChange): void {
        this.importer.encoding = event.value;
        this.importer.refreshFile();
    }

    /**
     * Returns a descriptive string for an import error
     */
    public getVerboseError(error: string): string {
        return this.importer.verbose(error);
    }

    /**
     * Checks if an error is present in a new entry
     * @param row
     * @param error
     */
    public hasError(row: NewEntry<ViewUser>, error: string): boolean {
        return this.importer.hasError(row, error);
    }
}
