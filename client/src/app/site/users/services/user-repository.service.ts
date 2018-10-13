import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewUser } from '../models/view-user';
import { User } from '../../../shared/models/users/user';
import { Group } from '../../../shared/models/users/group';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { DataSendService } from '../../../core/services/data-send.service';

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
     * Constructor calls the parent constructor
     */
    public constructor(DS: DataStoreService, private dataSend: DataSendService) {
        super(DS, User, [Group]);
    }

    /**
     * Updates a the selected user with the form values.
     *
     * @param update the forms values
     * @param viewUser
     */
    public update(update: Partial<User>, viewUser: ViewUser): Observable<any> {
        const updateUser = new User();
        // copy the ViewUser to avoid manipulation of parameters
        updateUser.patchValues(viewUser.user);
        updateUser.patchValues(update);

        // if the user deletes the username, reset
        // prevents the server of generating '<firstname> <lastname> +1' as username
        if (updateUser.username === '') {
            updateUser.username = viewUser.username;
        }

        return this.dataSend.updateModel(updateUser, 'put');
    }

    /**
     * Deletes a given user
     */
    public delete(viewUser: ViewUser): Observable<any> {
        return this.dataSend.delete(viewUser.user);
    }

    /**
     * creates and saves a new user
     *
     * TODO: used over not-yet-existing detail view
     * @param userData blank form value. Usually not yet a real user
     */
    public create(userData: Partial<User>): Observable<any> {
        const newUser = new User();
        // collectionString of userData is still empty
        newUser.patchValues(userData);

        // if the username is not present, delete.
        // The server will generate a one
        if (!newUser.username) {
            delete newUser.username;
        }

        // title must not be "null" during creation
        if (!newUser.title) {
            delete newUser.title;
        }

        // null values will not be accepted for group_id
        if (!newUser.groups_id) {
            delete newUser.groups_id;
        }

        return this.dataSend.createModel(newUser);
    }

    public createViewModel(user: User): ViewUser {
        const groups = this.DS.getMany(Group, user.groups_id);
        return new ViewUser(user, groups);
    }
}
