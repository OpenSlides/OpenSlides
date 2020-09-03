import { Directive, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { createDS, PblDataSource } from '@pebula/ngrid';
import { auditTime, distinctUntilChanged } from 'rxjs/operators';

import { BaseImportService, NewEntry, ValueLabelCombination } from 'app/core/ui-services/base-import.service';
import { BaseModel } from 'app/shared/models/base/base-model';
import { getLongPreview, getShortPreview } from 'app/shared/utils/previewStrings';
import { BaseViewComponent } from './base-view';

@Directive()
export abstract class BaseImportListComponentDirective<M extends BaseModel> extends BaseViewComponent
    implements OnInit {
    /**
     * The data source for a table. Requires to be initialised with a BaseViewModel
     */
    public dataSource: MatTableDataSource<NewEntry<M>>;

    /**
     * Data source for ngrid
     */
    public vScrollDataSource: PblDataSource<NewEntry<M>>;

    /**
     * Helper function for previews
     */
    public getLongPreview = getLongPreview;

    /**
     * Helper function for previews
     */
    public getShortPreview = getShortPreview;

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
    protected table: MatTable<NewEntry<M>>;

    /**
     * @returns the amount of total item successfully parsed
     */
    public get totalCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.total : null;
    }

    /**
     * @returns the encodings available and their labels
     */
    public get encodings(): ValueLabelCombination[] {
        return this.importer.encodings;
    }

    /**
     * @returns the available column separators and their labels
     */
    public get columnSeparators(): ValueLabelCombination[] {
        return this.importer.columnSeparators;
    }

    /**
     * @eturns the available text separators and their labels
     */
    public get textSeparators(): ValueLabelCombination[] {
        return this.importer.textSeparators;
    }

    /**
     * @returns the amount of import items that will be imported
     */
    public get newCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.new : 0;
    }

    /**
     * @returns the number of import items that cannot be imported
     */
    public get nonImportableCount(): number {
        if (this.importer && this.hasFile) {
            return this.importer.summary.errors + this.importer.summary.duplicates;
        }
        return 0;
    }

    /**
     * @returns the number of import items that have been successfully imported
     */
    public get doneCount(): number {
        return this.importer && this.hasFile ? this.importer.summary.done : 0;
    }

    /**
     * Constructor. Initializes the table and subscribes to import errors
     *
     * @param importer The import service, depending on the implementation
     * @param titleService A title service
     * @param translate TranslationService for translating strings
     * @param matSnackBar MatSnackBar for displaying errors
     */

    public constructor(
        protected importer: BaseImportService<M>,
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar
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

        const entryObservable = this.importer.getNewEntries();
        this.subscriptions.push(
            entryObservable.pipe(distinctUntilChanged(), auditTime(100)).subscribe(newEntries => {
                if (newEntries?.length) {
                    this.dataSource.data = newEntries;
                }
                this.hasFile = newEntries.length > 0;
            })
        );

        this.vScrollDataSource = createDS<NewEntry<M>>()
            .keepAlive()
            .onTrigger(() => entryObservable)
            .create();

        this.setFilter();
    }

    /**
     * Returns the table column definition. Fetches all headers from
     * {@link MotionImportService} and an additional status column
     *
     * @returns An array of the columns forming the import header, and an additional 'status' bar on the front
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
     *
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
            this.dataSource.filterPredicate = () => true;
            this.vScrollDataSource.setFilter();
        } else if (this.shown === 'noerror') {
            const noErrorFilter = data => {
                if (data.status === 'done') {
                    return true;
                } else if (data.status !== 'error') {
                    return true;
                }
            };

            this.dataSource.filterPredicate = noErrorFilter;
            this.vScrollDataSource.setFilter(noErrorFilter);
        } else if (this.shown === 'error') {
            const hasErrorFilter = data => {
                return !!data.errors.length || data.hasDuplicates;
            };

            this.dataSource.filterPredicate = hasErrorFilter;
            this.vScrollDataSource.setFilter(hasErrorFilter);
        }
        this.dataSource.filter = 'X'; // TODO: This is just a bogus non-null string to trigger the filter
    }

    /**
     * Get the appropiate css class for a row according to the import state
     *
     * @param row a newEntry object with a current status
     * @returns a css class name
     */
    public getStateClass(row: NewEntry<M>): string {
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
     * Get the icon for the action of the item
     * @param entry a newEntry object with a current status
     * @eturn the icon for the action of the item
     */
    public getActionIcon(entry: NewEntry<M>): string {
        switch (entry.status) {
            case 'error': // no import possible
                return 'block';
            case 'new':
                return '';
            case 'done': // item has been imported
                return 'done';
            default:
                // fallback: Error
                return 'block';
        }
    }

    /**
     * A function to trigger the csv example download.
     */
    public abstract downloadCsvExample(): void;

    /**
     * Trigger for the column separator selection.
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
     *
     * @param error The short string for the error as listed in the {@lilnk errorList}
     * @returns a predefined descriptive error string from the importer
     */
    public getVerboseError(error: string): string {
        return this.importer.verbose(error);
    }

    /**
     * Checks if an error is present in a new entry
     *
     * @param row the NewEntry
     * @param error An error as defined as key of {@link errorList}
     * @returns true if the error is present in the entry described in the row
     */
    public hasError(row: NewEntry<M>, error: string): boolean {
        return this.importer.hasError(row, error);
    }
}
