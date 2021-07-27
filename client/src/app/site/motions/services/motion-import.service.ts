import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';
import { Papa } from 'ngx-papaparse';

import { CategoryRepositoryService } from 'app/core/repositories/motions/category-repository.service';
import { MotionBlockRepositoryService } from 'app/core/repositories/motions/motion-block-repository.service';
import { MotionRepositoryService } from 'app/core/repositories/motions/motion-repository.service';
import { TagRepositoryService } from 'app/core/repositories/tags/tag-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { BaseImportService, NewEntry } from 'app/core/ui-services/base-import.service';
import { Tag } from 'app/shared/models/core/tag';
import { Category } from 'app/shared/models/motions/category';
import { Motion } from 'app/shared/models/motions/motion';
import { MotionBlock } from 'app/shared/models/motions/motion-block';
import { CreateMotion } from '../models/create-motion';
import { CsvMapping, ImportCreateMotion } from '../models/import-create-motion';
import { motionExportOnly, motionImportExportHeaderOrder } from '../motions.constants';

/**
 * Service for motion imports
 */
@Injectable({
    providedIn: 'root'
})
export class MotionImportService extends BaseImportService<Motion> {
    /**
     * List of possible errors and their verbose explanation
     */
    public errorList = {
        MotionBlock: 'Could not resolve the motion block',
        Category: 'Could not resolve the category',
        Submitters: 'Could not resolve the submitters',
        Tags: 'Could not resolve the tags',
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
     * supporters that need to be created prior to importing
     */
    public newSupporters: CsvMapping[] = [];

    /**
     * Categories that need to be created prior to importing
     */
    public newCategories: CsvMapping[] = [];

    /**
     * MotionBlocks that need to be created prior to importing
     */
    public newMotionBlocks: CsvMapping[] = [];

    /**
     * Mapping of the new tags for the imported motion.
     */
    public newTags: CsvMapping[] = [];

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
        private tagRepo: TagRepositoryService,
        translate: TranslateService,
        papa: Papa,
        matSnackbar: MatSnackBar
    ) {
        super(translate, papa, matSnackbar);
        this.expectedHeader = motionImportExportHeaderOrder.filter(head => !motionExportOnly.includes(head));
    }

    /**
     * Clears all temporary data specific to this importer.
     */
    public clearData(): void {
        this.newSubmitters = [];
        this.newSupporters = [];
        this.newCategories = [];
        this.newMotionBlocks = [];
        this.newTags = [];
    }

    /**
     * Parses a string representing an entry, extracting secondary data, appending
     * the array of secondary imports as needed
     *
     * @param line
     * @returns a new Entry representing a Motion
     */
    public mapData(line: string): NewEntry<Motion> {
        const newEntry = new ImportCreateMotion(new CreateMotion());
        const headerLength = Math.min(this.expectedHeader.length, line.length);
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'submitters':
                    newEntry.csvSubmitters = this.getUsers(line[idx], 'submitter');
                    break;
                case 'supporters':
                    newEntry.csvSupporters = this.getUsers(line[idx], 'supporter');
                    break;
                case 'category':
                    newEntry.csvCategory = this.getCategory(line[idx]);
                    break;
                case 'motion_block':
                    newEntry.csvMotionblock = this.getMotionBlock(line[idx]);
                    break;
                case 'tags':
                    newEntry.csvTags = this.getTags(line[idx]);
                    break;
                default:
                    newEntry[this.expectedHeader[idx]] = line[idx];
            }
        }
        const hasDuplicates = this.repo.getViewModelList().some(motion => motion.identifier === newEntry.identifier);
        const entry: NewEntry<Motion> = {
            newEntry: newEntry,
            hasDuplicates: hasDuplicates,
            status: hasDuplicates ? 'error' : 'new',
            errors: hasDuplicates ? ['Duplicates'] : []
        };
        if (!entry.newEntry.title) {
            this.setError(entry, 'Title');
        }
        if (!entry.newEntry.text) {
            this.setError(entry, 'Title');
        }
        return entry;
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
        this.newSubmitters = await this.createNewUsers(this.newSubmitters);
        this.newSupporters = await this.createNewUsers(this.newSupporters);
        this.newTags = await this.createNewTags();

        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            const openBlocks = (entry.newEntry as ImportCreateMotion).solveMotionBlocks(this.newMotionBlocks);
            if (openBlocks) {
                this.setError(entry, 'MotionBlock');
                this.updatePreview();
                continue;
            }
            const openCategories = (entry.newEntry as ImportCreateMotion).solveCategory(this.newCategories);
            if (openCategories) {
                this.setError(entry, 'Category');
                this.updatePreview();
                continue;
            }
            const openSubmitters = (entry.newEntry as ImportCreateMotion).solveSubmitters(this.newSubmitters);
            if (openSubmitters) {
                this.setError(entry, 'Submitters');
                this.updatePreview();
                continue;
            }
            const openSupporters = (entry.newEntry as ImportCreateMotion).solveSupporters(this.newSupporters);
            if (openSupporters) {
                this.setError(entry, 'Supporters');
                this.updatePreview();
                continue;
            }
            const openTags = (entry.newEntry as ImportCreateMotion).solveTags(this.newTags);
            if (openTags) {
                this.setError(entry, 'Tags');
                this.updatePreview();
                continue;
            }
            await this.repo.create(entry.newEntry as ImportCreateMotion);
            entry.status = 'done';
        }
        this.updatePreview();
    }

    /**
     * Checks the provided submitter(s) and returns an object with mapping of
     * existing users and of users that need to be created
     *
     * @param userList
     * @returns a list of submitters mapped with (if already existing) their id
     */
    public getUsers(userList: string, kind: 'submitter' | 'supporter'): CsvMapping[] {
        console.log('kind: ', kind);
        const result: CsvMapping[] = [];
        if (!userList) {
            return result;
        }
        const userArray = userList.split(','); // TODO fails with 'full name'

        console.log('userArray: ', userList);
        for (const user of userArray) {
            const existingUsers = this.userRepo.getUsersByName(user.trim());
            if (!existingUsers.length) {
                if (kind === 'submitter') {
                    if (!this.newSubmitters.find(listedSubmitter => listedSubmitter.name === user)) {
                        this.newSubmitters.push({ name: user });
                    }
                    result.push({ name: user });
                } else if (kind === 'supporter') {
                    if (!this.newSupporters.find(listedSupporter => listedSupporter.name === user)) {
                        this.newSupporters.push({ name: user });
                    }
                    result.push({ name: user });
                }
            }
            if (existingUsers.length === 1) {
                result.push({
                    name: existingUsers[0].short_name,
                    id: existingUsers[0].id
                });
            }
            if (existingUsers.length > 1) {
                result.push({
                    name: user,
                    multiId: existingUsers.map(ex => ex.id)
                });
                this.matSnackbar.open('TODO: multiple possible users found for this string', 'ok');
                // TODO How to handle several submitters ? Is this possible?
                // should have some kind of choice dialog there
            }
        }

        console.log('res: ', result);
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
    public getCategory(categoryString: string): CsvMapping | null {
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
    public getMotionBlock(blockString: string): CsvMapping | null {
        if (!blockString) {
            return null;
        }
        blockString = blockString.trim();
        let existingBlock = this.motionBlockRepo.getMotionBlocksByTitle(blockString);
        if (!existingBlock.length) {
            existingBlock = this.motionBlockRepo.getMotionBlocksByTitle(this.translate.instant(blockString));
        }
        if (existingBlock.length) {
            return { id: existingBlock[0].id, name: existingBlock[0].title };
        } else {
            if (!this.newMotionBlocks.find(newBlock => newBlock.name === blockString)) {
                this.newMotionBlocks.push({ name: blockString });
            }
            return { name: blockString };
        }
    }

    /**
     * Iterates over the given string separated by ','
     * Creates for every found string a tag.
     *
     * @param tagList The list of tags as string.
     *
     * @returns {CsvMapping[]} The list of tags as csv-mapping.
     */
    public getTags(tagList: string): CsvMapping[] {
        const result: CsvMapping[] = [];
        if (!tagList) {
            return result;
        }

        const tagArray = tagList.split(',');
        for (let tag of tagArray) {
            tag = tag.trim();
            const existingTag = this.tagRepo.getViewModelList().find(tagInRepo => tagInRepo.name === tag);
            if (existingTag) {
                result.push({ id: existingTag.id, name: existingTag.name });
            } else {
                if (!this.newTags.find(entry => entry.name === tag)) {
                    this.newTags.push({ name: tag });
                }
                result.push({ name: tag });
            }
        }
        return result;
    }

    /**
     * Creates all new Users needed for the import.
     *
     * @returns a promise with list of new Submitters, updated with newly created ids
     */
    private async createNewUsers(list: CsvMapping[]): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const user of list) {
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
     * Combines all tags which are new created to one promise.
     *
     * @returns {Promise} One promise containing all promises to create a new tag.
     */
    private async createNewTags(): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const tag of this.newTags) {
            promises.push(
                this.tagRepo
                    .create(new Tag({ name: tag.name }))
                    .then(identifiable => ({ name: tag.name, id: identifiable.id }))
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
