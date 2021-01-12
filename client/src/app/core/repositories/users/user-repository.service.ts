import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { ConstantsService } from 'app/core/core-services/constants.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { PreventedInDemo } from 'app/core/definitions/custom-errors';
import { RelationDefinition } from 'app/core/definitions/relations';
import { NewEntry } from 'app/core/ui-services/base-import.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { User } from 'app/shared/models/users/user';
import { ViewGroup } from 'app/site/users/models/view-group';
import { UserTitleInformation, ViewUser } from 'app/site/users/models/view-user';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { environment } from '../../../../environments/environment';

export interface MassImportResult {
    importedTrackIds: number[];
    errors: { [id: number]: string };
}

export interface NewUser {
    id: number;
    name: string;
}

/**
 * type for determining the user name from a string during import.
 * See {@link parseUserString} for implementations
 */
type StringNamingSchema = 'lastCommaFirst' | 'firstSpaceLast';

type SortProperty = 'first_name' | 'last_name' | 'number';

const UserRelations: RelationDefinition[] = [
    {
        type: 'M2M',
        ownIdKey: 'groups_id',
        ownKey: 'groups',
        foreignViewModel: ViewGroup
    },
    {
        type: 'M2O',
        ownIdKey: 'vote_delegated_to_id',
        ownKey: 'voteDelegatedTo',
        foreignViewModel: ViewUser
    },
    {
        type: 'M2M',
        ownIdKey: 'vote_delegated_from_users_id',
        ownKey: 'voteDelegationsFrom',
        foreignViewModel: ViewUser
    }
];

/**
 * Repository service for users
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class UserRepositoryService extends BaseRepository<ViewUser, User, UserTitleInformation> {
    /**
     * The property the incoming data is sorted by
     */
    protected sortProperty: SortProperty;

    private demoModeUserIds: number[] | null = null;

    /**
     * Constructor for the user repo
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param translate
     * @param httpService
     * @param configService
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        relationManager: RelationManagerService,
        protected translate: TranslateService,
        private httpService: HttpService,
        private configService: ConfigService,
        private constantsService: ConstantsService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, User, UserRelations);
        this.sortProperty = this.configService.instant('users_sort_by');
        this.configService.get<SortProperty>('users_sort_by').subscribe(conf => {
            this.sortProperty = conf;
            this.setConfigSortFn();
        });
        this.constantsService.get<{ DEMO_USERS?: number[] }>('Settings').subscribe(settings => {
            if (settings) {
                this.demoModeUserIds = settings.DEMO_USERS || null;
            }
        });
    }

    public getTitle = (titleInformation: UserTitleInformation) => {
        return this.getFullName(titleInformation);
    };

    /**
     * Getter for the short name (Title, given name, surname)
     *
     * @returns a non-empty string
     */
    public getShortName(titleInformation: UserTitleInformation): string {
        const title = titleInformation.title ? titleInformation.title.trim() : '';
        const firstName = titleInformation.first_name ? titleInformation.first_name.trim() : '';
        const lastName = titleInformation.last_name ? titleInformation.last_name.trim() : '';
        let shortName = `${firstName} ${lastName}`;

        if (shortName.length <= 1) {
            // We have at least one space from the concatination of
            // first- and lastname.
            shortName = titleInformation.username;
        }

        if (title) {
            shortName = `${title} ${shortName}`;
        }

        return shortName;
    }

    public getFullName(titleInformation: UserTitleInformation): string {
        let name = this.getShortName(titleInformation);
        const additions: string[] = [];

        // addition: add number and structure level
        const structure_level = titleInformation.structure_level ? titleInformation.structure_level.trim() : '';
        if (structure_level) {
            additions.push(structure_level);
        }

        const number = titleInformation.number ? titleInformation.number.trim() : '';
        if (number) {
            additions.push(`${this.translate.instant('No.')} ${number}`);
        }

        if (additions.length > 0) {
            name += ' (' + additions.join(' · ') + ')';
        }
        return name.trim();
    }

    public getLevelAndNumber(titleInformation: UserTitleInformation): string {
        if (titleInformation.structure_level && titleInformation.number) {
            return `${titleInformation.structure_level} · ${this.translate.instant('No.')} ${titleInformation.number}`;
        } else if (titleInformation.structure_level) {
            return titleInformation.structure_level;
        } else if (titleInformation.number) {
            return `${this.translate.instant('No.')} ${titleInformation.number}`;
        } else {
            return '';
        }
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Participants' : 'Participant');
    };

    /**
     * Generates a random password
     *
     * @param length The length of the password to generate
     * @returns a random password
     */
    public getRandomPassword(length: number = 10): string {
        let pw = '';
        const characters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        // set charactersLengthPower2 to characters.length rounded up to the next power of two
        let charactersLengthPower2 = 1;
        while (characters.length > charactersLengthPower2) {
            charactersLengthPower2 *= 2;
        }
        while (pw.length < length) {
            const random = new Uint8Array(length - pw.length);
            window.crypto.getRandomValues(random);
            for (let i = 0; i < random.length; i++) {
                const r = random[i] % charactersLengthPower2;
                if (r < characters.length) {
                    pw += characters.charAt(r);
                }
            }
        }
        return pw;
    }

    /**
     * Adds the short and full name to the view user.
     */
    protected createViewModelWithTitles(model: User): ViewUser {
        const viewModel = super.createViewModelWithTitles(model);
        viewModel.getFullName = () => this.getFullName(viewModel);
        viewModel.getShortName = () => this.getShortName(viewModel);
        viewModel.getLevelAndNumber = () => this.getLevelAndNumber(viewModel);
        return viewModel;
    }

    /**
     * Updates the password and sets the password without checking for the old one.
     * Also resets the 'default password' to the newly created one.
     *
     * @param user The user to update
     * @param password The password to set
     * @param updateDefaultPassword Control, if the default password should be updated.
     */
    public async resetPassword(user: ViewUser, password: string): Promise<void> {
        this.preventAlterationOnDemoUsers(user);
        const path = `/rest/users/user/${user.id}/reset_password/`;
        await this.httpService.post(path, { password: password });
    }

    /**
     * Updates the password and sets a new one, if the old one was correct.
     *
     * @param oldPassword the old password
     * @param newPassword the new password
     */
    public async setNewPassword(user: ViewUser, oldPassword: string, newPassword: string): Promise<void> {
        this.preventAlterationOnDemoUsers(user);
        await this.httpService.post(`${environment.urlPrefix}/users/setpassword/`, {
            old_password: oldPassword,
            new_password: newPassword
        });
    }

    /**
     * Resets the passwords of all given users to their default ones. The operator will
     * not be changed (if provided in `users`).
     *
     * @param users The users to reset the passwords from
     */
    public async bulkResetPasswordsToDefault(users: ViewUser[]): Promise<void> {
        this.preventInDemo();
        await this.httpService.post('/rest/users/user/bulk_reset_passwords_to_default/', {
            user_ids: users.map(user => user.id)
        });
    }

    /**
     * Generates new random passwords for many users. The default password will be set to these. The
     * operator will not be changed (if provided in `users`).
     *
     * @param users The users to generate new passwords for
     */
    public async bulkGenerateNewPasswords(users: ViewUser[]): Promise<void> {
        this.preventInDemo();
        await this.httpService.post('/rest/users/user/bulk_generate_passwords/', {
            user_ids: users.map(user => user.id)
        });
    }

    /**
     * Creates and saves a list of users in a bulk operation.
     *
     * @param newEntries
     */
    public async bulkCreate(newEntries: NewEntry<User>[]): Promise<MassImportResult> {
        const data = newEntries.map(entry => {
            return { ...entry.newEntry, importTrackId: entry.importTrackId };
        });
        return await this.httpService.post<MassImportResult>(`/rest/users/user/mass_import/`, { users: data });
    }

    public async update(update: Partial<User>, viewModel: ViewUser): Promise<void> {
        this.preventAlterationOnDemoUsers(viewModel);
        return super.update(update, viewModel);
    }

    public async delete(viewModel: ViewUser): Promise<void> {
        this.preventInDemo();
        return super.delete(viewModel);
    }

    /**
     * Deletes many users. The operator will not be deleted (if included in `uisers`)
     *
     * @param users The users to delete
     */
    public async bulkDelete(users: ViewUser[]): Promise<void> {
        this.preventInDemo();
        await this.httpService.post('/rest/users/user/bulk_delete/', { user_ids: users.map(user => user.id) });
    }

    /**
     * Sets the state of many users. The "state" means any boolean attribute of a user like active or committee.
     *
     * @param users The users to set the state
     * @param field The boolean field to set
     * @param value The value to set this field to.
     */
    public async bulkSetState(
        users: ViewUser[],
        field: 'is_active' | 'is_present' | 'is_committee',
        value: boolean
    ): Promise<void> {
        this.preventAlterationOnDemoUsers(users);
        await this.httpService.post('/rest/users/user/bulk_set_state/', {
            user_ids: users.map(user => user.id),
            field: field,
            value: value
        });
    }

    /**
     * Alters groups of all given users. Either adds or removes the given groups.
     *
     * @param users Affected users
     * @param action add or remove the groups
     * @param groupIds All group ids to add or remove
     */
    public async bulkAlterGroups(users: ViewUser[], action: 'add' | 'remove', groupIds: number[]): Promise<void> {
        this.preventAlterationOnDemoUsers(users);
        await this.httpService.post('/rest/users/user/bulk_alter_groups/', {
            user_ids: users.map(user => user.id),
            action: action,
            group_ids: groupIds
        });
    }

    /**
     * Sends invitation emails to all given users. Returns a prepared string to show the user.
     * This string should always be shown, becuase even in success cases, some users may not get
     * an email and the user should be notified about this.
     *
     * @param users All affected users
     */
    public async bulkSendInvitationEmail(users: ViewUser[]): Promise<string> {
        this.preventInDemo();
        const user_ids = users.map(user => user.id);
        const users_email_subject = this.configService.instant<string>('users_email_subject');
        const users_email_body = this.configService.instant<string>('users_email_body');
        const subject = this.translate.instant(users_email_subject);
        const message = this.translate.instant(users_email_body);

        const response = await this.httpService.post<{ count: Number; no_email_ids: number[] }>(
            '/rest/users/user/mass_invite_email/',
            {
                user_ids: user_ids,
                subject: subject,
                message: message
            }
        );
        const numEmails = response.count;
        const noEmailIds = response.no_email_ids;
        let msg;
        if (numEmails === 0) {
            msg = this.translate.instant('No emails were send.');
        } else if (numEmails === 1) {
            msg = this.translate.instant('One email was send sucessfully.');
        } else {
            msg = this.translate.instant('%num% emails were send sucessfully.');
            msg = msg.replace('%num%', numEmails);
        }

        if (noEmailIds.length) {
            msg += ' ';

            if (noEmailIds.length === 1) {
                msg += this.translate.instant(
                    'The user %user% has no email, so the invitation email could not be send.'
                );
            } else {
                msg += this.translate.instant(
                    'The users %user% have no email, so the invitation emails could not be send.'
                );
            }

            // This one builds a username string like "user1, user2 and user3" with the full names.
            const usernames = noEmailIds
                .map(id => this.getViewModel(id))
                .filter(user => !!user)
                .map(user => user.short_name);
            let userString;
            if (usernames.length > 1) {
                const lastUsername = usernames.pop();
                userString = usernames.join(', ') + ' ' + this.translate.instant('and') + ' ' + lastUsername;
            } else {
                userString = usernames.join(', ');
            }
            msg = msg.replace('%user%', userString);
        }

        return msg;
    }

    /**
     * Searches and returns Users by full name
     *
     * @param name
     * @returns all users matching that name (unsorted)
     */
    public getUsersByName(name: string): ViewUser[] {
        return this.getViewModelList().filter(user => {
            return user.full_name === name || user.short_name === name || user.number === name;
        });
    }

    /**
     * Searches and returns Users by participant number
     *
     * @param number: A participant number
     * @returns all users matching that number
     */
    public getUsersByNumber(number: string): ViewUser[] {
        return this.getViewModelList().filter(user => user.number === number);
    }

    /**
     * Creates a new User from a string
     *
     * @param user: String to create the user from
     * @returns Promise with a created user id and the raw name used as input
     */
    public async createFromString(user: string): Promise<NewUser> {
        const newUser = this.parseUserString(user);
        const createdUser = await this.create(newUser);
        return { id: createdUser.id, name: user } as NewUser;
    }

    /**
     * Tries to convert a user string into an user. Names that don't fit the scheme given
     * will be entered into the first_name field
     *
     * Naming schemes are:
     * - firstSpaceLast: One or two space-separated words are assumed, matching
     * given name and surname
     * - lastCommaFirst: A comma is supposed to separate last name(s) from given name(s).
     * TODO: More advanced logic(s) to fit names
     *
     * @param inputUser A raw user string
     * @param schema optional hint on how to handle the strings.
     * @returns A User object (note: is only a local object, not uploaded to the server)
     */
    public parseUserString(inputUser: string, schema: StringNamingSchema = 'firstSpaceLast'): User {
        const newUser: Partial<User> = {};
        if (schema === 'lastCommaFirst') {
            const commaSeparated = inputUser.split(',');
            switch (commaSeparated.length) {
                case 1:
                    newUser.first_name = commaSeparated[0];
                    break;
                case 2:
                    newUser.last_name = commaSeparated[0];
                    newUser.first_name = commaSeparated[1];
                    break;
                default:
                    newUser.first_name = inputUser;
            }
        } else if (schema === 'firstSpaceLast') {
            const splitUser = inputUser.split(' ');
            switch (splitUser.length) {
                case 1:
                    newUser.first_name = splitUser[0];
                    break;
                case 2:
                    newUser.first_name = splitUser[0];
                    newUser.last_name = splitUser[1];
                    break;
                default:
                    newUser.first_name = inputUser;
            }
        }
        return new User(newUser);
    }

    /**
     * Returns all duplicates of an user (currently: full name matches)
     *
     * @param user
     */
    public getUserDuplicates(user: ViewUser): ViewUser[] {
        return this.getViewModelList().filter(existingUser => existingUser.full_name === user.full_name);
    }

    /**
     * Triggers an update for the sort function responsible for the default sorting of data items
     */
    public setConfigSortFn(): void {
        this.setSortFunction((a: ViewUser, b: ViewUser) => {
            if (a[this.sortProperty] && b[this.sortProperty]) {
                if (a[this.sortProperty] === b[this.sortProperty]) {
                    return this.languageCollator.compare(a.short_name, b.short_name);
                } else {
                    return this.languageCollator.compare(a[this.sortProperty], b[this.sortProperty]);
                }
            } else if (a[this.sortProperty] && !b[this.sortProperty]) {
                return -1;
            } else if (b[this.sortProperty]) {
                return 1;
            } else {
                return this.languageCollator.compare(a.short_name, b.short_name);
            }
        });
    }

    /**
     * Get the date of the last invitation email.
     *
     * @param user
     * @returns a localized string representation of the date/time the last email was sent;
     * or an empty string
     */
    public lastSentEmailTimeString(user: ViewUser): string {
        if (!user.user || !user.user.last_email_send) {
            return '';
        }
        return new Date(user.user.last_email_send).toLocaleString(this.translate.currentLang);
    }

    private preventAlterationOnDemoUsers(users: ViewUser | ViewUser[]): void {
        if (Array.isArray(users)) {
            if (this.demoModeUserIds && users.map(user => user.id).intersect(this.demoModeUserIds).length > 0) {
                this.preventInDemo();
            }
        } else if (this.demoModeUserIds?.some(userId => userId === users.id)) {
            this.preventInDemo();
        }
    }

    private preventInDemo(): void {
        if (this.demoModeUserIds && this.demoModeUserIds.length) {
            throw new PreventedInDemo();
        }
    }
}
