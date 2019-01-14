import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Papa, PapaParseConfig } from 'ngx-papaparse';
import { TranslateService } from '@ngx-translate/core';
import { BaseViewModel } from 'app/site/base/base-view-model';

/**
 * Interface for value- Label combinations.
 * Map objects didn't work, TODO: Use map objects (needs iterating through all objects of a map)
 */
export interface ValueLabelCombination {
    value: string;
    label: string;
}

/**
 * Interface matching a newly created entry with their duplicates and an import status
 */
export interface NewEntry<V> {
    newEntry: V;
    status: CsvImportStatus;
    errors: string[];
    duplicates: V[];
}

/**
 * interface for a preview summary
 */
export interface ImportCSVPreview {
    total: number;
    duplicates: number;
    errors: number;
    new: number;
    done: number;
}

/**
 * The permitted states of a new entry. Only a 'new' entry should be imported
 * and then be set to 'done'.
 */
type CsvImportStatus = 'new' | 'error' | 'done';

/**
 * Abstract service for imports
 */
@Injectable({
    providedIn: 'root'
})
export abstract class TextImportService<V extends BaseViewModel> {
    public abstract errorList: Object;

    /**
     * The headers expected in the CSV matching import model's properties (in order)
     */
    public expectedHeader: (keyof V)[];

    /**
     * The minimimal number of header entries needed to successfully create an entry
     */
    public requiredHeaderLength: number;

    /**
     * The last parsed file object (may be reparsed with new encoding, thus kept in memory)
     */
    private _rawFile: File;

    /**
     * The used column separator. If left on an empty string (default),
     * the papaparse parser will automatically decide on separators.
     */
    public columnSeparator = '';

    /**
     * The used text separator.
     */
    public textSeparator = '"';

    /**
     * The encoding used by the FileReader object.
     */
    public encoding = 'utf-8';

    /**
     * List of possible encodings and their label. values should be values accepted
     * by the FileReader API
     */
    public encodings: ValueLabelCombination[] = [
        { value: 'utf-8', label: 'UTF 8 - Unicode' },
        { value: 'iso-8859-1', label: 'ISO 8859-1 - West European' },
        { value: 'iso-8859-15', label: 'ISO 8859-15 - West European (with €)' }
    ];

    /**
     * List of possible column separators to pass on to papaParse
     */
    public columnSeparators: ValueLabelCombination[] = [
        { label: 'Comma', value: ',' },
        { label: 'Semicolon', value: ';' },
        // {label: 'Tabulator', value: '\t'},
        { label: 'Automatic', value: '' }
    ];

    /**
     * List of possible text separators to pass on to papaParse. Note that
     * it cannot automatically detect textseparators (value must not be an empty string)
     */
    public textSeparators: ValueLabelCombination[] = [
        { label: 'Double quotes (")', value: '"' },
        { label: "Single quotes (')", value: "'" }
    ];

    /**
     * FileReader object for file import
     */
    private reader = new FileReader();

    /**
     * the list of parsed models that have been extracted from the opened file
     */
    private _entries: NewEntry<V>[] = [];

    /**
     * BehaviorSubject for displaying a preview for the currently selected entries
     */
    public newEntries = new BehaviorSubject<NewEntry<V>[]>([]);

    /**
     * Emits an error string to display if a file import cannot be done
     */
    public errorEvent = new EventEmitter<string>();

    /**
     * storing the summary preview for the import, to avoid recalculating it
     * at each display change.
     */
    protected _preview: ImportCSVPreview;

    /**
     * Returns a summary on actions that will be taken/not taken.
     */
    public get summary(): ImportCSVPreview {
        if (!this._preview) {
            this.updatePreview();
        }
        return this._preview;
    }

    /**
     * Returns the current entries. For internal use in extending classes, as it
     * might not be filled with data at all times (see {@link newEntries} for a BehaviorSubject)
     */
    protected get entries(): NewEntry<V>[] {
        return this._entries;
    }

    /**
     * Constructor. Creates a fileReader to subscribe to it for incoming parsed strings
     * @param translate Translation service
     * @param papa External csv parser (ngx-papaparser)
     * @param matSnackBar snackBar to display import errors
     */
    public constructor(protected translate: TranslateService, private papa: Papa, protected matSnackbar: MatSnackBar) {
        this.reader.onload = (event: any) => {
            // TODO type: event is a progressEvent,
            // but has a property target.result, which typescript doesn't recognize
            this.parseInput(event.target.result);
        };
    }

    /**
     * Clears all stored secondary data
     * TODO: Merge with clearPreview()
     */
    public abstract clearData(): void;

    /**
     * Parses the data input. Expects a string as returned by via a
     * File.readAsText() operation
     *
     * @param file
     */
    public parseInput(file: string): void {
        this.clearData();
        this.clearPreview();
        const papaConfig: PapaParseConfig = {
            header: false,
            skipEmptyLines: true,
            quoteChar: this.textSeparator
        };
        if (this.columnSeparator) {
            papaConfig.delimiter = this.columnSeparator;
        }
        const entryLines = this.papa.parse(file, papaConfig).data;
        const valid = this.checkHeader(entryLines.shift());
        if (!valid) {
            return;
        }
        entryLines.forEach(line => {
            this._entries.push(this.mapData(line));
        });
        this.newEntries.next(this._entries);
        this.updatePreview();
    }

    /**
     * Parsing an e string representing an entry, extracting secondary data, returning a new entry object
     * @param line a line extracted by the CSV (without the header)
     */
    public abstract mapData(line: string): NewEntry<V>;

    /**
     * Trigger for executing the import.
     */
    public abstract async doImport(): Promise<void>;

    /**
     * counts the amount of duplicates that have no decision on the action to
     * be taken
     */
    public updatePreview(): void {
        const summary = {
            total: 0,
            new: 0,
            duplicates: 0,
            errors: 0,
            done: 0
        };
        this._entries.forEach(entry => {
            summary.total += 1;
            if (entry.status === 'done') {
                summary.done += 1;
                return;
            } else if (entry.status === 'error' && !entry.duplicates.length) {
                // errors that are not due to duplicates
                summary.errors += 1;
                return;
            } else if (entry.duplicates.length) {
                summary.duplicates += 1;
                return;
            } else if (entry.status === 'new') {
                summary.new += 1;
            }
        });
        this._preview = summary;
    }

    /**
     * returns a subscribable representation of the new items to be imported
     */
    public getNewEntries(): Observable<NewEntry<V>[]> {
        return this.newEntries.asObservable();
    }

    /**
     * Handler after a file was selected. Basic checking for type, then hand
     * over to parsing
     *
     * @param event type is Event, but has target.files, which typescript doesn't seem to recognize
     */
    public onSelectFile(event: any): void {
        // TODO type
        if (event.target.files && event.target.files.length === 1) {
            if (event.target.files[0].type === 'text/csv') {
                this._rawFile = event.target.files[0];
                this.readFile(event.target.files[0]);
            } else {
                this.matSnackbar.open(this.translate.instant('Wrong file type detected. Import failed.'), '', {
                    duration: 3000
                });
                this.clearPreview();
                this._rawFile = null;
            }
        }
    }

    /**
     * Rereads the (previously selected) file, if present. Thought to be triggered
     * by parameter changes on encoding, column, text separators
     */
    public refreshFile(): void {
        if (this._rawFile) {
            this.readFile(this._rawFile);
        }
    }

    /**
     * (re)-reads a given file with the current parameter
     */
    private readFile(file: File): void {
        this.reader.readAsText(file, this.encoding);
    }

    /**
     * Checks the first line of the csv (the header) for consistency (length)
     *
     * @param row expected to be an array parsed from the first line of a csv file
     */
    private checkHeader(row: string[]): boolean {
        const snackbarDuration = 3000;
        if (row.length < this.requiredHeaderLength) {
            this.matSnackbar.open(this.translate.instant('The file has too few columns to be parsed properly.'), '', {
                duration: snackbarDuration
            });

            this.clearPreview();
            return false;
        } else if (row.length < this.expectedHeader.length) {
            this.matSnackbar.open(
                this.translate.instant('The file seems to have some ommitted columns. They will be considered empty.'),
                '',
                { duration: snackbarDuration }
            );
        } else if (row.length > this.expectedHeader.length) {
            this.matSnackbar.open(
                this.translate.instant('The file seems to have additional columns. They will be ignored.'),
                '',
                { duration: snackbarDuration }
            );
        }
        return true;
    }

    /**
     * Resets the data and preview (triggered upon selecting an invalid file)
     */
    public clearPreview(): void {
        this._entries = [];
        this.newEntries.next([]);
        this._preview = null;
    }

    /**
     * set a list of short names for error, indicating which column failed
     */
    public setError(entry: NewEntry<V>, error: string): void {
        if (this.errorList.hasOwnProperty(error)) {
            if (!entry.errors) {
                entry.errors = [error];
            } else if (!entry.errors.includes(error)) {
                entry.errors.push(error);
                entry.status = 'error';
            }
        }
    }

    /**
     * Get an extended error description.
     * @param error
     */
    public verbose(error: string): string {
        return this.errorList[error];
    }

    /**
     * Queries if a given error is present in the given entry
     *
     * @param entry
     * @param error
     */
    public hasError(entry: NewEntry<V>, error: string): boolean {
        return entry.errors.includes(error);
    }
}
