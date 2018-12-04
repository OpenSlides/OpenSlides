import { BehaviorSubject, Observable } from 'rxjs';
import { Injectable, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Papa, PapaParseConfig } from 'ngx-papaparse';
import { TranslateService } from '@ngx-translate/core';

import { Category } from 'app/shared/models/motions/category';
import { CategoryRepositoryService } from './category-repository.service';
import { CreateMotion } from '../models/create-motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionBlockRepositoryService } from './motion-block-repository.service';
import { MotionRepositoryService } from './motion-repository.service';
import { UserRepositoryService } from '../../users/services/user-repository.service';
import { ViewMotion } from '../models/view-motion';
import { ViewCsvCreateMotion, CsvMapping } from '../models/view-csv-create-motion';

/**
 * Interface for value- Label combinations.
 * Map objects didn't work, TODO: Use map objects (needs iterating through all objects of a map)
 */
export interface ValueLabelCombination {
    value: string;
    label: string;
}

/**
 * Interface for a new Motion and their (if any) duplicates
 */
export interface NewMotionEntry {
    newMotion: ViewCsvCreateMotion;
    duplicates: ViewMotion[];
}

/**
 * interface for a preview summary
 */
interface ImportMotionCSVPreview {
    total: number;
    duplicates: number;
    errors: number;
    new: number;
    done: number;
}

/**
 * List of possible import errors specific for motion imports.
 */
const errorList = {
    MotionBlock: 'Could not resolve the motion block',
    Category: 'Could not resolve the category',
    Submitters: 'Could not resolve the submitters',
    Title: 'A title is required',
    Text: "A content in the 'text' column is required",
    Duplicates: 'A motion with this identifier already exists.',
    generic: 'Server upload failed' // TODO
};

/**
 * Service for motion imports
 */
@Injectable({
    providedIn: 'root'
})
export class MotionImportService {
    /** The header (order and items) that is expected from the imported file
     *
     */
    public expectedHeader = [
        'identifier',
        'title',
        'text',
        'reason',
        'submitters',
        'category',
        'origin',
        'motion block'
    ];

    /**
     * The last parsed file object (may be reparsed with new encoding, thus kept in memory)
     */
    private _rawFile: File;

    /**
     * The used column Separator. If left on an empty string (default),
     * the papaparse parser will automatically decide on separators.
     */
    public columnSeparator = '';

    public textSeparator = '"';

    public encoding = 'utf-8';

    /**
     * List of possible encodings and their label
     */
    public encodings: ValueLabelCombination[] = [
        { value: 'utf-8', label: 'UTF 8 - Unicode' },
        { value: 'iso-8859-1', label: 'ISO 8859-1 - West European' },
        { value: 'iso-8859-15', label: 'ISO 8859-15 - West European (with €)' }
    ];

    /**
     * List of possible column separators
     */
    public columnSeparators: ValueLabelCombination[] = [
        { label: 'Comma', value: ',' },
        { label: 'Semicolon', value: ';' },
        // {label: 'Tabulator', value: '\t'},
        { label: 'Automatic', value: '' }
    ];

    public textSeparators: ValueLabelCombination[] = [
        { label: 'Double quotes (")', value: '"' },
        { label: "Single quotes (')", value: "'" }
    ];

    /**
     * submitters that need to be created prior to importing
     */
    public newSubmitters: CsvMapping[] = [];

    /**
     * Categories that need to be created prior to importing
     */
    public newCategories: CsvMapping[] = [];

    /**
     * MotionBlocks that need to be created prior to importing
     */
    public newMotionBlocks: CsvMapping[] = [];

    /**
     * FileReader object for file import
     */
    private reader = new FileReader();

    /**
     * the list of parsed models that have been extracted from the opened file
     */
    private _entries: NewMotionEntry[] = [];

    /**
     * BehaviorSubject for displaying a preview for the currently selected entries
     */
    public newEntries = new BehaviorSubject<NewMotionEntry[]>([]);

    /**
     * Emits an error string to display if a file import cannot be done
     */
    public errorEvent = new EventEmitter<string>();

    /**
     * storing the summary preview for the import, to avoid recalculating it
     * at each display change.
     */
    private _preview: ImportMotionCSVPreview;

    /**
     * Returns a summary on actions that will be taken/not taken.
     */
    public get summary(): ImportMotionCSVPreview {
        if (!this._preview) {
            this.updatePreview();
        }
        return this._preview;
    }

    /**
     * Constructor. Creates a fileReader to subscribe to it for incoming parsed
     * strings
     * @param categoryRepo Repository to fetch pre-existing categories
     * @param motionBlockRepo Repository to fetch pre-existing motionBlocks
     * @param userRepo Repository to query/ create users
     * @param translate Translation service
     * @param papa External csv parser (ngx-papaparser)
     * @param matSnackBar snackBar to display import errors
     */
    public constructor(
        private repo: MotionRepositoryService,
        private categoryRepo: CategoryRepositoryService,
        private motionBlockRepo: MotionBlockRepositoryService,
        private userRepo: UserRepositoryService,
        private translate: TranslateService,
        private papa: Papa,
        private matSnackbar: MatSnackBar
    ) {
        this.reader.onload = (event: any) => {
            // TODO type: event is a progressEvent,
            // but has a property target.result, which typescript doesn't recognize
            this.parseInput(event.target.result);
        };
    }

    /**
     * Parses the data input. Expects a string as returned by via a
     * File.readAsText() operation
     *
     * @param file
     */
    public parseInput(file: string): void {
        this._entries = [];
        this.newSubmitters = [];
        this.newCategories = [];
        this.newMotionBlocks = [];
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
            const newMotion = new ViewCsvCreateMotion(new CreateMotion());
            const headerLength = Math.min(this.expectedHeader.length, line.length);
            for (let idx = 0; idx < headerLength; idx++) {
                // iterate over items, find existing ones (thier id) and collect new entries
                switch (this.expectedHeader[idx]) {
                    case 'submitters':
                        newMotion.csvSubmitters = this.getSubmitters(line[idx]);
                        break;
                    case 'category':
                        newMotion.csvCategory = this.getCategory(line[idx]);
                        break;
                    case 'motion block':
                        newMotion.csvMotionblock = this.getMotionBlock(line[idx]);
                        break;
                    default:
                        newMotion.motion[this.expectedHeader[idx]] = line[idx];
                }
            }
            const updateModels = this.getDuplicates(newMotion.motion);
            if (updateModels.length) {
                this.setError(newMotion, 'Duplicates');
            }
            this._entries.push({ newMotion: newMotion, duplicates: updateModels });
        });
        this.newEntries.next(this._entries);
        this.updatePreview();
    }

    /**
     * Triggers the import.
     */
    public async doImport(): Promise<void> {
        this.newMotionBlocks = await this.createNewMotionBlocks();
        this.newCategories = await this.createNewCategories();
        this.newSubmitters = await this.createNewUsers();

        for (const entry of this._entries) {
            if (entry.newMotion.status !== 'new') {
                continue;
            }
            const openBlocks = entry.newMotion.solveMotionBlocks(this.newMotionBlocks);
            if (openBlocks) {
                this.setError(entry.newMotion, 'MotionBlock');
                // TODO error handling if not all submitters could be matched
                this.updatePreview();
                continue;
            }
            const openCategories = entry.newMotion.solveCategory(this.newCategories);
            if (openCategories) {
                this.setError(entry.newMotion, 'Category');
                this.updatePreview();
                continue;
            }
            const openUsers = entry.newMotion.solveSubmitters(this.newSubmitters);
            if (openUsers) {
                this.setError(entry.newMotion, 'Submitters');
                this.updatePreview();
                continue;
            }
            await this.repo.create(entry.newMotion.motion);
            entry.newMotion.done();
        }
        this.updatePreview();
    }

    /**
     * Checks the dataStore for duplicates
     * @returns an array of duplicates with the same identifier.
     * @param motion
     */
    public getDuplicates(motion: CreateMotion): ViewMotion[] {
        return this.repo.getMotionDuplicates(motion);
    }

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
            if (entry.newMotion.status === 'done') {
                summary.done += 1;
                return;
            } else if (entry.newMotion.status === 'error' && !entry.duplicates.length) {
                // errors that are not due to duplicates
                summary.errors += 1;
                return;
            } else if (entry.duplicates.length) {
                summary.duplicates += 1;
                return;
            } else if (entry.newMotion.status === 'new') {
                summary.new += 1;
            }
        });
        this._preview = summary;
    }

    /**
     * returns a subscribable representation of the new Users to be imported
     */
    public getNewEntries(): Observable<NewMotionEntry[]> {
        return this.newEntries.asObservable();
    }

    /**
     * Checks the provided submitter(s) and returns an object with mapping of
     * existing users and of users that need to be created
     * @param submitterlist
     */
    public getSubmitters(submitterlist: string): CsvMapping[] {
        const result: CsvMapping[] = [];
        if (!submitterlist) {
            return result;
        }
        const submitterArray = submitterlist.split(','); // TODO fails with 'full name'
        for (const submitter of submitterArray) {
            const existingSubmitters = this.userRepo.getUsersByName(submitter);
            if (!existingSubmitters.length) {
                if (!this.newSubmitters.find(listedSubmitter => listedSubmitter.name === submitter)) {
                    this.newSubmitters.push({ name: submitter });
                }
                result.push({ name: submitter });
            }
            if (existingSubmitters.length === 1) {
                result.push({
                    name: existingSubmitters[0].short_name,
                    id: existingSubmitters[0].id
                });
            }
            if (existingSubmitters.length > 1) {
                result.push({
                    name: submitter,
                    multiId: existingSubmitters.map(ex => ex.id)
                });
                this.matSnackbar.open('TODO: multiple possible users found for this string', 'ok');
                // TODO How to handle several submitters ? Is this possible?
                // should have some kind of choice dialog there
            }
        }
        return result;
    }

    /**
     * Checks the provided category/ies and returns a mapping, expands
     * newCategories if needed.
     *
     * The assumption is that there may or not be a prefix wit up to 5
     * characters at the beginning, separated by ' - ' from the name.
     * It will also accept a registered translation between the current user's
     * language and english
     * @param categoryString
     */
    public getCategory(categoryString: string): CsvMapping {
        if (!categoryString) {
            return null;
        }
        const category = this.splitCategoryString(categoryString);
        const existingCategory = this.categoryRepo.getViewModelList().find(cat => {
            if (category.prefix && cat.prefix !== category.prefix) {
                return false;
            }
            if (cat.name === category.name) {
                return true;
            }
            if (this.translate.instant(cat.name) === category.name) {
                return true;
            }
            return false;
        });
        if (existingCategory) {
            return {
                name: existingCategory.prefixedName,
                id: existingCategory.id
            };
        } else {
            if (!this.newCategories.find(newCat => newCat.name === categoryString)) {
                this.newCategories.push({ name: categoryString });
            }
            return { name: categoryString };
        }
    }

    /**
     * Checks the motionBlock provided in the string for existance, expands newMotionBlocks
     * if needed. Note that it will also check for translation between the current
     * user's language and english
     * @param blockString
     */
    public getMotionBlock(blockString: string): CsvMapping {
        if (!blockString) {
            return null;
        }
        blockString = blockString.trim();
        let existingBlock = this.motionBlockRepo.getMotionBlockByTitle(blockString);
        if (!existingBlock) {
            existingBlock = this.motionBlockRepo.getMotionBlockByTitle(this.translate.instant(blockString));
        }
        if (existingBlock) {
            return { id: existingBlock.id, name: existingBlock.title };
        } else {
            if (!this.newMotionBlocks.find(newBlock => newBlock.name === blockString)) {
                this.newMotionBlocks.push({ name: blockString });
            }
            return { name: blockString };
        }
    }

    /**
     * Creates all new Users needed for the import.
     */
    private async createNewUsers(): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const user of this.newSubmitters) {
            promises.push(this.userRepo.createFromString(user.name));
        }
        return await Promise.all(promises);
    }

    /**
     * Creates all new Motion Blocks needed for the import.
     */
    private async createNewMotionBlocks(): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const block of this.newMotionBlocks) {
            promises.push(
                this.motionBlockRepo.create(new MotionBlock({ title: block.name })).then(identifiable => {
                    return { name: block.name, id: identifiable.id };
                })
            );
        }
        return await Promise.all(promises);
    }

    /**
     * Creates all new Categories needed for the import.
     */
    private async createNewCategories(): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const category of this.newCategories) {
            const cat = this.splitCategoryString(category.name);
            promises.push(
                this.categoryRepo
                    .create(
                        new Category({
                            name: cat.name,
                            prefix: cat.prefix ? cat.prefix : null
                        })
                    )
                    .then(identifiable => {
                        return { name: category.name, id: identifiable.id };
                    })
            );
        }
        return await Promise.all(promises);
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
     * @param row expected to be an array parsed from the first line of a csv file
     */
    private checkHeader(row: string[]): boolean {
        const snackbarDuration = 3000;
        if (row.length < 4) {
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
    public setError(motion: ViewCsvCreateMotion, error: string): void {
        if (errorList.hasOwnProperty(error) && !motion.errors.includes(error)) {
            motion.errors.push(error);
            motion.status = 'error';
        }
    }

    /**
     * Get an extended error description.
     * @param error
     */
    public verbose(error: string): string {
        return errorList[error];
    }

    /**
     * Helper to separate a category string from its' prefix. Assumes that a prefix is no longer
     * than 5 chars and separated by a ' - '
     * @param categoryString the string to parse
     */
    private splitCategoryString(categoryString: string): { prefix: string; name: string } {
        let prefixSeparator = ' - ';
        if (categoryString.startsWith(prefixSeparator)) {
            prefixSeparator = prefixSeparator.substring(1);
        }
        categoryString = categoryString.trim();
        let prefix = '';
        const separatorIndex = categoryString.indexOf(prefixSeparator);

        if (separatorIndex >= 0 && separatorIndex < 6) {
            prefix = categoryString.substring(0, separatorIndex);
            categoryString = categoryString.substring(separatorIndex + prefixSeparator.length);
        }
        return { prefix: prefix, name: categoryString };
    }
}
