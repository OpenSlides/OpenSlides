import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';
import { Papa } from 'ngx-papaparse';

import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { UserRepositoryService } from 'app/core/repositories/users/user-repository.service';
import { BaseImportService, NewEntry } from 'app/core/ui-services/base-import.service';
import { Group } from 'app/shared/models/users/group';
import { User } from 'app/shared/models/users/user';
import { CsvMapping, ImportCreateUser } from '../models/import-create-user';

@Injectable({
    providedIn: 'root'
})
export class UserImportService extends BaseImportService<User> {
    /**
     * Helper for mapping the expected header in a typesafe way. Values and order
     * will be passed to {@link expectedHeader}
     */
    public headerMap: (keyof ImportCreateUser)[] = [
        'title',
        'first_name',
        'last_name',
        'structure_level',
        'number',
        'csvGroups',
        'comment',
        'is_active',
        'is_present',
        'is_committee',
        'default_password',
        'email',
        'username',
        'gender',
        'vote_weight'
    ];

    /**
     * The minimimal number of header entries needed to successfully create an entry
     */
    public requiredHeaderLength = 3;

    /**
     * List of possible errors and their verbose explanation
     */
    public errorList = {
        Group: 'Group cannot be resolved',
        Duplicates: 'This user already exists',
        NoName: 'Entry has no valid name',
        DuplicateImport: 'Entry cannot be imported twice. This line will be ommitted',
        ParsingErrors: 'Some csv values could not be read correctly.',
        FailedImport: 'Imported user could not be imported.',
        vote_weight: 'The vote weight has too many decimal places (max.: 6).'
    };

    /**
     * Storage for tracking new groups to be created prior to importing users
     */
    public newGroups: CsvMapping[];

    /**
     * Constructor. Calls parent and sets the expected header
     *
     * @param repo The User repository
     * @param groupRepo the Group repository
     * @param translate TranslationService
     * @param papa csvParser
     * @param matSnackbar MatSnackBar for displaying error messages
     */
    public constructor(
        private repo: UserRepositoryService,
        private groupRepo: GroupRepositoryService,
        translate: TranslateService,
        papa: Papa,
        matSnackbar: MatSnackBar
    ) {
        super(translate, papa, matSnackbar);
        this.expectedHeader = this.headerMap;
    }

    /**
     * Clears all temporary data specific to this importer
     */
    public clearData(): void {
        this.newGroups = [];
    }

    /**
     * Parses a string representing an entry, extracting secondary data, appending
     * the array of secondary imports as needed
     *
     * @param line
     * @returns a new entry representing an User
     */
    public mapData(line: string): NewEntry<User> {
        const user = new ImportCreateUser();
        const headerLength = Math.min(this.expectedHeader.length, line.length);

        let hasErrors = false;
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'csvGroups':
                    user.csvGroups = this.getGroups(line[idx]);
                    break;
                case 'is_active':
                case 'is_committee':
                case 'is_present':
                    try {
                        user[this.expectedHeader[idx]] = this.toBoolean(line[idx]);
                    } catch (e) {
                        if (e instanceof TypeError) {
                            console.log(e);
                            hasErrors = true;
                            continue;
                        }
                    }
                    break;
                case 'number':
                    user.number = line[idx];
                    break;
                case 'vote_weight':
                    if (!line[idx]) {
                        user[this.expectedHeader[idx]] = 1;
                    } else {
                        user[this.expectedHeader[idx]] = line[idx];
                    }
                    break;
                default:
                    user[this.expectedHeader[idx]] = line[idx];
                    break;
            }
        }
        const newEntry = this.userToEntry(user);
        if (hasErrors) {
            this.setError(newEntry, 'ParsingErrors');
        }
        return newEntry;
    }

    /**
     * Executing the import. Creates all secondary data, maps the newly created
     * secondary data to the new entries, then creates all entries without errors
     * by submitting them to the server. The entries will receive the status
     * 'done' on success.
     */
    public async doImport(): Promise<void> {
        this.newGroups = await this.createNewGroups();
        const importUsers: NewEntry<User>[] = [];
        let trackId = 1;
        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            (entry.newEntry as ImportCreateUser).solveGroups(this.newGroups);
            entry.importTrackId = trackId;
            trackId += 1;
            importUsers.push(entry);
        }

        while (importUsers.length) {
            const subSet = importUsers.splice(0, 100); // don't send bulks too large
            const result = await this.repo.bulkCreate(subSet);
            subSet.forEach(importUser => {
                // const importModel = this.entries.find(e => e.importTrackId === importUser.importTrackId);
                if (importUser && result.importedTrackIds.includes(importUser.importTrackId)) {
                    importUser.status = 'done';
                } else if (result.errors[importUser.importTrackId]) {
                    this.setError(importUser, result.errors[importUser.importTrackId]);
                } else {
                    this.setError(importUser, 'FailedImport');
                }
            });
            this.updatePreview();
        }
    }

    /**
     * extracts the group(s) from a csv column and tries to match them against existing groups,
     * appending to {@link newGroups} if needed.
     * Also checks for groups matching the translation between english and the language currently set
     *
     * @param groupString string from an entry line including one or more comma separated groups
     * @returns a mapping with (if existing) ids to the group names
     */
    private getGroups(groupString: string): CsvMapping[] {
        const result: CsvMapping[] = [];
        if (!groupString) {
            return [];
        }
        groupString.trim();
        const groupArray = groupString.split(',');
        for (const item of groupArray) {
            const newGroup = item.trim();
            let existingGroup = this.groupRepo.getViewModelList().filter(grp => grp.name === newGroup);
            if (!existingGroup.length) {
                existingGroup = this.groupRepo
                    .getViewModelList()
                    .filter(grp => this.translate.instant(grp.name) === newGroup);
            }
            if (!existingGroup.length) {
                if (!this.newGroups.find(listedGrp => listedGrp.name === newGroup)) {
                    this.newGroups.push({ name: newGroup });
                }
                result.push({ name: newGroup });
            } else if (existingGroup.length === 1) {
                result.push({
                    name: existingGroup[0].name,
                    id: existingGroup[0].id
                });
            }
        }
        return result;
    }

    /**
     * Handles the creation of new groups collected in {@link newGroups}.
     *
     * @returns The group mapping with (on success) new ids
     */
    private async createNewGroups(): Promise<CsvMapping[]> {
        const promises: Promise<CsvMapping>[] = [];
        for (const group of this.newGroups) {
            promises.push(
                this.groupRepo.create(new Group({ name: group.name })).then(identifiable => {
                    return { name: group.name, id: identifiable.id };
                })
            );
        }
        return await Promise.all(promises);
    }

    /**
     * translates a string into a boolean
     *
     * @param data
     * @returns a boolean from the string
     */
    private toBoolean(data: string): Boolean {
        if (!data || data === '0' || data === 'false') {
            return false;
        } else if (data === '1' || data === 'true') {
            return true;
        } else {
            throw new TypeError('Value cannot be translated into boolean: ' + data);
        }
    }

    /**
     * parses the data given by the textArea. Expects user names separated by lines.
     * Comma separated values will be read as Surname(s), given name(s) (lastCommaFirst)
     *
     * @param data a string as produced by textArea input
     */
    public parseTextArea(data: string): void {
        const newEntries: NewEntry<User>[] = [];
        this.clearData();
        this.clearPreview();
        const lines = data.split('\n');
        lines.forEach(line => {
            if (!line.length) {
                return;
            }
            const nameSchema = line.includes(',') ? 'lastCommaFirst' : 'firstSpaceLast';
            const newUser = new ImportCreateUser(this.repo.parseUserString(line, nameSchema));
            const newEntry = this.userToEntry(newUser);
            newEntries.push(newEntry);
        });
        this.setParsedEntries(newEntries);
    }

    /**
     * Checks a newly created ViewCsvCreateuser for validity and duplicates,
     *
     * @param user
     * @returns a NewEntry with duplicate/error information
     */
    private userToEntry(user: ImportCreateUser): NewEntry<User> {
        const newEntry: NewEntry<User> = {
            newEntry: user,
            hasDuplicates: false,
            status: 'new',
            errors: []
        };
        if (user.isValid) {
            newEntry.hasDuplicates = this.repo
                .getViewModelList()
                .some(existingUser => existingUser.full_name === this.repo.getFullName(user));
            if (newEntry.hasDuplicates) {
                this.setError(newEntry, 'Duplicates');
            }
        } else {
            this.setError(newEntry, 'NoName');
        }
        return newEntry;
    }
}
