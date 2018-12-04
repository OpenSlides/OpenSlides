import { MatTableDataSource, MatTable, MatSnackBar, MatSelectChange } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewChild, Component, OnInit } from '@angular/core';

import { BaseViewComponent } from 'app/site/base/base-view';
import { MotionCsvExportService } from '../../services/motion-csv-export.service';
import { MotionImportService, NewMotionEntry, ValueLabelCombination } from '../../services/motion-import.service';

/**
 * Component for the motion import list view.
 */
@Component({
    selector: 'os-motion-import-list',
    templateUrl: './motion-import-list.component.html',
    styleUrls: ['./motion-import-list.component.scss']
})
export class MotionImportListComponent extends BaseViewComponent implements OnInit {
    /**
     * The data source for a table. Requires to be initialised with a BaseViewModel
     */
    public dataSource: MatTableDataSource<NewMotionEntry>;

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
    protected table: MatTable<NewMotionEntry>;

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
     * @param motionCSVExport: service for exporting example data
     */
    public constructor(
        titleService: Title,
        matSnackBar: MatSnackBar,
        public translate: TranslateService,
        private importer: MotionImportService,
        private motionCSVExport: MotionCsvExportService
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
                if (data.newMotion.status === 'done') {
                    return true;
                } else if (!(data.newMotion.status !== 'error') && !data.duplicates.length) {
                    return true;
                }
            };
        } else if (this.shown === 'error') {
            this.dataSource.filterPredicate = (data, filter) => {
                if (data.newMotion.errors.length || data.duplicates.length) {
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
    public getStateClass(row: NewMotionEntry): string {
        switch (row.newMotion.status) {
            case 'done':
                return 'import-done import-decided';
            case 'error':
                return 'import-error';
            default:
                return '';
        }
    }

    /**
     * Returns the first characters of a string, for preview purposes
     *
     * @param input
     */
    public getShortPreview(input: string): string {
        if (input.length > 50) {
            return this.stripHtmlTags(input.substring(0, 47)) + '...';
        }
        return this.stripHtmlTags(input);
    }

    /**
     * Returns the first and last 150 characters of a string; used within
     * tooltips for the preview
     *
     * @param input
     */
    public getLongPreview(input: string): string {
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
     * Return the icon for the action of the item
     * @param entry
     */
    public getActionIcon(entry: NewMotionEntry): string {
        switch (entry.newMotion.status) {
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
     * Helper to remove html tags from a string.
     * CAUTION: It is just a basic "don't show distracting html tags in a
     * preview", not an actual tested sanitizer!
     * @param inputString
     */
    private stripHtmlTags(inputString: string): string {
        const regexp = new RegExp(/<[^ ][^<>]*(>|$)/g);
        return inputString.replace(regexp, '').trim();
    }

    /**
     * Triggers an example csv download
     */
    public downloadCsvExample(): void {
        this.motionCSVExport.exportDummyMotion();
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
}
