import { Injectable } from '@angular/core';
import { TextImportService, NewEntry } from 'app/core/services/text-import.service';
import { ViewUser } from '../models/view-user';
import { TranslateService } from '@ngx-translate/core';
import { Papa } from 'ngx-papaparse';
import { MatSnackBar } from '@angular/material';
import { User } from 'app/shared/models/users/user';
import { Group } from 'app/shared/models/users/group';
import { ViewCsvCreateUser, CsvMapping } from '../models/view-csv-create-user';
import { UserRepositoryService } from './user-repository.service';
import { GroupRepositoryService } from './group-repository.service';

@Injectable({
    providedIn: 'root'
})
export class UserImportService extends TextImportService<ViewUser> {

    /** Definition of the headers expected.
     * TODO Quite bloaty because typescript complains about the 'readonly' property of some (unused) ViewUser properties in
     * mapData(). It would run just fine with the default (keyof ViewMotion)[]
     */
    public expectedHeader: (
        | 'title'
        | 'first_name'
        | 'last_name'
        | 'structure_level'
        | 'participant_number'
        | 'groups_id'
        | 'comment'
        | 'is_active'
        | 'is_present'
        | 'is_committee'
        | 'default_password'
        | 'email')[] = [
        'title',
        'first_name',
        'last_name',
        'structure_level',
        'participant_number',
        'groups_id',
        'comment',
        'is_active',
        'is_present',
        'is_committee',
        'default_password',
        'email'
    ];

    /**
     * At least the names columns must exist
     */
    public requiredHeaderLength = 3;

    /**
     * A list of possible import errors specific to Users
     */
    public errorList = {
        Group: 'Group cannot be resolved',
        Duplicates: 'This user already exists',
        NoName: 'Entry has no valid name'
    };
    /**
     * Storage for tracking new groups to be created prior to importing users
     */
    public newGroups: CsvMapping[];

    /**
     * Constructor
     */
    public constructor(
        private repo: UserRepositoryService,
        private groupRepo: GroupRepositoryService,
        translate: TranslateService,
        papa: Papa,
        matSnackbar: MatSnackBar
    ) {
        super(translate, papa, matSnackbar);
    }

    /**
     * Clears all stored secondary data
     * TODO: Merge with clearPreview()
     */
    public clearData(): void {
        this.newGroups = [];
    }

    public mapData(line: string): NewEntry<ViewUser> {
        const newEntry = new ViewCsvCreateUser(new User());
        const headerLength = Math.min(this.expectedHeader.length, line.length);
        for (let idx = 0; idx < headerLength; idx++) {
            switch (this.expectedHeader[idx]) {
                case 'groups_id':
                    newEntry.csvGroups = this.getGroups(line[idx]);
                    break;
                case 'is_active':
                case 'is_committee':
                case 'is_present':
                    newEntry.user[this.expectedHeader[idx]] = this.toBoolean(line[idx]);
                    break;
                default:
                    newEntry.user[this.expectedHeader[idx]] = line[idx];
                    break;
            }
        }
        if (newEntry.isValid){
            const updateModels = this.repo.getUserDuplicates(newEntry);
            return {
                newEntry: newEntry,
                duplicates: updateModels,
                status: updateModels.length ? 'error' : 'new',
                errors: updateModels.length ? ['Duplicates'] : []
            };
        } else {
            return {
                newEntry: newEntry,
                duplicates: [],
                status: 'error',
                errors: ['NoName']
            };
        }
    }

    public async doImport(): Promise<void> {
        this.newGroups = await this.createNewGroups();
        for (const entry of this.entries) {
            if (entry.status !== 'new') {
                continue;
            }
            const openBlocks = (entry.newEntry as ViewCsvCreateUser).solveGroups(this.newGroups);
            if (openBlocks) {
                this.setError(entry, 'Group');
                this.updatePreview();
                continue;
            }
            await this.repo.create(entry.newEntry.user);
            entry.status = 'done';
        }
        this.updatePreview();
    }

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
     * @param data
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
}
