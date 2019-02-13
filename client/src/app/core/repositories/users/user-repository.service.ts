import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { BaseRepository } from '../base-repository';
import { ViewUser } from 'app/site/users/models/view-user';
import { User } from 'app/shared/models/users/user';
import { Group } from 'app/shared/models/users/group';
import { DataStoreService } from '../../core-services/data-store.service';
import { DataSendService } from '../../core-services/data-send.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { HttpService } from 'app/core/core-services/http.service';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { ViewGroup } from 'app/site/users/models/view-group';

/**
 * type for determining the user name from a string during import.
 * See {@link parseUserString} for implementations
 */
type StringNamingSchema = 'lastCommaFirst' | 'firstSpaceLast';

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
     * Constructor for the user repo
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private translate: TranslateService,
        private httpService: HttpService,
        private configService: ConfigService
    ) {
        super(DS, mapperService, viewModelStoreService, User, [Group]);
    }

    public createViewModel(user: User): ViewUser {
        const groups = this.viewModelStoreService.getMany(ViewGroup, user.groups_id);
        const viewUser = new ViewUser(user, groups);
        viewUser.getVerboseName = (plural: boolean = false) => {
            return this.translate.instant(plural ? 'Participants' : 'Participant');
        };
        return viewUser;
    }

    /**
     * Updates a the selected user with the form values.
     *
     * @param update the forms values
     * @param viewUser
     */
    public async update(update: Partial<User>, viewUser: ViewUser): Promise<void> {
        const updateUser = new User();
        // copy the ViewUser to avoid manipulation of parameters
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
     * Deletes a given user
     */
    public async delete(viewUser: ViewUser): Promise<void> {
        return await this.dataSend.deleteModel(viewUser.user);
    }

    /**
     * creates and saves a new user
     *
     * TODO: used over not-yet-existing detail view
     * @param userData blank form value. Usually not yet a real user
     */
    public async create(userData: Partial<User>): Promise<Identifiable> {
        const newUser = new User();
        // collectionString of userData is still empty
        newUser.patchValues(userData);

        // during creation, the server demands that basically nothing must be null.
        // during the update process, null values are interpreted as delete.
        // therefore, remove "null" values.
        Object.keys(newUser).forEach(key => {
            if (!newUser[key]) {
                delete newUser[key];
            }
        });

        return await this.dataSend.createModel(newUser);
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
     * @returns all users matching that name
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
     * Tries to convert a user string into an user. If it is two words, expect
     * a first and a last name, if one word only, expect a first name only.
     * If more than two words, they will all be put as the first name
     * TODO: More advanced logic to fit names
     *
     * @param inputUser A raw user string
     * @param schema optional hint on how to handle the strings. TODO: Not fully implemented.
     * @returns A User object (not uploaded to the server)
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
     * @param user
     */
    public getUserDuplicates(user: ViewUser): ViewUser[] {
        return this.getViewModelList().filter(existingUser => existingUser.full_name === user.full_name);
    }

    /**
     * @returns the observable for users sorted according to configuration
     */
    public getSortedViewModelListObservable(): Observable<ViewUser[]> {
        const subject = new BehaviorSubject<ViewUser[]>([]);
        this.getViewModelListObservable().subscribe(users => {
            subject.next(this.sortViewUsersByConfig(users));
        });
        return subject.asObservable();
    }

    /**
     * Sort viewUsers by the configured settings
     *
     * @param users
     * @returns the users sorted by first name, last name or number, according
     * to the config setting. Fallthrough and identical cases will be sorted by
     * 'short_name'
     */
    public sortViewUsersByConfig(users: ViewUser[]): ViewUser[] {
        const sort = this.configService.instant<'first_name' | 'last_name' | 'number'>('users_sort_by') || 'last_name';
        return users.sort((a, b) => {
            if (a[sort] && b[sort]) {
                if (a[sort] === b[sort]) {
                    return a.short_name.localeCompare(b.short_name, this.translate.currentLang);
                } else {
                    return a[sort].localeCompare(b[sort], this.translate.currentLang);
                }
            } else if (a[sort] && !b[sort]) {
                return -1;
            } else if (b[sort]) {
                return 1;
            } else {
                return a.short_name.localeCompare(b.short_name);
            }
        });
    }
}
