import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Papa } from 'ngx-papaparse';
import { TranslateService } from '@ngx-translate/core';

import { Category } from 'app/shared/models/motions/category';
import { CategoryRepositoryService } from '../../../core/repositories/motions/category-repository.service';
import { CreateMotion } from '../models/create-motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { MotionBlockRepositoryService } from '../../../core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from '../../../core/repositories/motions/motion-repository.service';
import { UserRepositoryService } from '../../../core/repositories/users/user-repository.service';
import { ViewCsvCreateMotion, CsvMapping } from '../models/view-csv-create-motion';
import { BaseImportService, NewEntry } from 'app/core/ui-services/base-import.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Service for motion imports
 */
@Injectable({
    providedIn: 'root'
})
export class MotionImportService extends BaseImportService<ViewMotion> {
    /**
     * List of possible errors and their verbose explanation
     */
    public errorList = {
        MotionBlock: 'Could not resolve the motion block',
        Category: 'Could not resolve the category',
        Submitters: 'Could not resolve the submitters',
        Title: 'A title is required',
        Text: "A content in the 'text' column is required",
        Duplicates: 'A motion with this identifier already exists.'
    };

    /**
     * The minimimal number of header entries needed to successfully create an entry
     */
    public requiredHeaderLength = 3;

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
     * Constructor. Defines the headers expected and calls the abstract class
     * @param repo: The repository for motions.
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
        translate: TranslateService,
        papa: Papa,
        matSnackbar: MatSnackBar
    ) {
        super(translate, papa, matSnackbar);

        this.expectedHeader = [
            'identifier',
            'title',
            'text',
            'reason',
            'submitters',
            'category',
            'origin',
            'motion_block'
        ];
    }

    /**
     * Clears all temporary data specific to this importer.
     */
    public clearData(): void {
        this.newSubmitters = [];
        this.newCategories = [];
        this.newMotionBlocks = [];
    }

    /**
     * Parses a string representing an entry, extracting secondary data, appending
     * the array of secondary imports as needed
     *
     * @param line
     * @returns a new Entry representing a Motion
     */
    public mapData(line: string): NewEntry<ViewMotion> {
        const newEntry = new ViewCsvCreateMotion(new CreateMotion());
        const headerLength = Math.min(this.expectedHeader.length, line.length);
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'submitters':
                    newEntry.csvSubmitters = this.getSubmitters(line[idx]);
                    break;
                case 'category':
                    newEntry.csvCategory = this.getCategory(line[idx]);
                    break;
                case 'motion_block':
                    newEntry.csvMotionblock = this.getMotionBlock(line[idx]);
                    break;
                default:
                    newEntry.motion[this.expectedHeader[idx]] = line[idx];
            }
        }
        const updateModels = this.repo.getMotionDuplicates(newEntry);
        return {
            newEntry: newEntry,
            duplicates: updateModels,
            status: updateModels.length ? 'error' : 'new',
            errors: updateModels.length ? ['Duplicates'] : []
        };
    }

    /**
     * Executes the import. Creates all secondary data, maps the newly created
     * secondary data to the new entries, then creates all entries without errors
     * by submitting them to the server. The entries will receive the status
     * 'done' on success.
     */
    public async doImport(): Promise<void> {
        this.newMotionBlocks = await this.createNewMotionBlocks();
        this.newCategories = await this.createNewCategories();
        this.newSubmitters = await this.createNewUsers();

        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            const openBlocks = (entry.newEntry as ViewCsvCreateMotion).solveMotionBlocks(this.newMotionBlocks);
            if (openBlocks) {
                this.setError(entry, 'MotionBlock');
                this.updatePreview();
                continue;
            }
            const openCategories = (entry.newEntry as ViewCsvCreateMotion).solveCategory(this.newCategories);
            if (openCategories) {
                this.setError(entry, 'Category');
                this.updatePreview();
                continue;
            }
            const openUsers = (entry.newEntry as ViewCsvCreateMotion).solveSubmitters(this.newSubmitters);
            if (openUsers) {
                this.setError(entry, 'Submitters');
                this.updatePreview();
                continue;
            }
            await this.repo.create((entry.newEntry as ViewCsvCreateMotion).motion);
            entry.status = 'done';
        }
        this.updatePreview();
    }

    /**
     * Checks the provided submitter(s) and returns an object with mapping of
     * existing users and of users that need to be created
     *
     * @param submitterlist
     * @returns a list of submitters mapped with (if already existing) their id
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
     *
     * @param categoryString
     * @returns categories mapped to existing categories
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
     *
     * @param blockString
     * @returns a CSVMap with the MotionBlock and an id (if the motionBlock is already in the dataStore)
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
     *
     * @returns a promise with list of new Submitters, updated with newly created ids
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
     *
     * @returns a promise with list of new MotionBlocks, updated with newly created ids
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
     *
     * @returns a promise with list of new Categories, updated with newly created ids
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
     * Helper to separate a category string from its' prefix. Assumes that a prefix is no longer
     * than 5 chars and separated by a ' - '
     *
     * @param categoryString the string to parse
     * @returns an object with .prefix and .name strings
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
