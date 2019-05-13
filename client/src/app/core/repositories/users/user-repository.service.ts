import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { environment } from '../../../../environments/environment';
import { Group } from 'app/shared/models/users/group';
import { HttpService } from 'app/core/core-services/http.service';
import { NewEntry } from 'app/core/ui-services/base-import.service';
import { User } from 'app/shared/models/users/user';
import { ViewUser } from 'app/site/users/models/view-user';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 * type for determining the user name from a string during import.
 * See {@link parseUserString} for implementations
 */
type StringNamingSchema = 'lastCommaFirst' | 'firstSpaceLast';

type SortProperty = 'first_name' | 'last_name' | 'number';

/**
 * Repository service for users
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class UserRepositoryService extends BaseRepository<ViewUser, User> {
    /**
     * The property the incoming data is sorted by
     */
    protected sortProperty: SortProperty;

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
        protected translate: TranslateService,
        private httpService: HttpService,
        private configService: ConfigService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, User, [Group]);
        this.sortProperty = this.configService.instant('users_sort_by');
        this.configService.get<SortProperty>('users_sort_by').subscribe(conf => {
            this.sortProperty = conf;
            this.setConfigSortFn();
        });
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Participants' : 'Participant');
    };

    public createViewModel(user: User): ViewUser {
        const groups = this.viewModelStoreService.getMany(ViewGroup, user.groups_id);
        const viewUser = new ViewUser(user, groups);
        viewUser.getVerboseName = this.getVerboseName;
        viewUser.getNumberForName = (nr: number) => {
            return `${this.translate.instant('No.')} ${nr}`;
        };
        return viewUser;
    }

    /**
     * Updates a the selected user with the form values.
     * Since user should actually "delete" field, the unified update method
     * cannot be used
     *
     * @param update the forms values
     * @param viewUser
     */
    public async update(update: Partial<User>, viewUser: ViewUser): Promise<void> {
        const updateUser = new User();
        updateUser.patchValues(viewUser.user);
        updateUser.patchValues(update);

        // if the user deletes the username, reset
        // prevents the server of generating '<firstname> <lastname> +1' as username
        if (updateUser.username === '') {
            updateUser.username = viewUser.username;
        }

        // if the update user does not have a gender-field, send gender as empty string.
        // This allow to delete a previously selected gender
        if (!updateUser.gender) {
            updateUser.gender = '';
        }

        return await this.dataSend.updateModel(updateUser);
    }

    /**
     * Creates and saves a list of users in a bulk operation.
     *
     * @param newEntries
     */
    public async bulkCreate(newEntries: NewEntry<ViewUser>[]): Promise<number[]> {
        const data = newEntries.map(entry => {
            return { ...entry.newEntry.user, importTrackId: entry.importTrackId };
        });
        const response = (await this.httpService.post(`/rest/users/user/mass_import/`, { users: data })) as {
            detail: string;
            importedTrackIds: number[];
        };
        return response.importedTrackIds;
    }

    /**
     * Generates a random password
     *
     * @param length THe length of the password to generate
     * @returns a random password
     */
    public getRandomPassword(length: number = 8): string {
        let pw = '';
        const characters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        for (let i = 0; i < length; i++) {
            pw += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return pw;
    }

    /**
     * Updates the password and sets the password without checking for the old one.
     * Also resets the 'default password' to the newly created one.
     *
     * @param user The user to update
     * @param password The password to set
     * @param updateDefaultPassword Control, if the default password should be updated.
     */
    public async resetPassword(
        user: ViewUser,
        password: string,
        updateDefaultPassword: boolean = false
    ): Promise<void> {
        const path = `/rest/users/user/${user.id}/reset_password/`;
        await this.httpService.post(path, { password: password, update_default_password: updateDefaultPassword });
    }

    /**
     * Updates the password and sets a new one, if the old one was correct.
     *
     * @param oldPassword the old password
     * @param newPassword the new password
     */
    public async setNewPassword(oldPassword: string, newPassword: string): Promise<void> {
        await this.httpService.post(`${environment.urlPrefix}/users/setpassword/`, {
            old_password: oldPassword,
            new_password: newPassword
        });
    }

    /**
     * Sends invitation emails to all given users. Returns a prepared string to show the user.
     * This string should always be shown, becuase even in success cases, some users may not get
     * an email and the user should be notified about this.
     *
     * @param users All affected users
     */
    public async sendInvitationEmail(users: ViewUser[]): Promise<string> {
        const user_ids = users.map(user => user.id);
        const subject = this.translate.instant(this.configService.instant('users_email_subject'));
        const message = this.translate.instant(this.configService.instant('users_email_body'));

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
            msg = this.translate.instant('%num% emails were send sucessfully.').replace('%num%', numEmails);
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
    public async createFromString(user: string): Promise<{ id: number; name: string }> {
        const newUser = this.parseUserString(user);
        const createdUser = await this.create(newUser);
        return { id: createdUser.id, name: user };
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
    public parseUserString(inputUser: string, schema?: StringNamingSchema): User {
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
        } else if (!schema || schema === 'firstSpaceLast') {
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
}
