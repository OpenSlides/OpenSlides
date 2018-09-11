import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewUser } from '../models/view-user';
import { User } from '../../../shared/models/users/user';
import { Group } from '../../../shared/models/users/group';
import { Observable } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';

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
    public constructor(DS: DataStoreService) {
        super(DS, User, [Group]);
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public save(user: User, viewUser: ViewUser): Observable<User> {
        return null;
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public delete(user: ViewUser): Observable<User> {
        return null;
    }

    /**
     * @ignore
     *
     * TODO: used over not-yet-existing detail view
     */
    public create(user: User, viewFile: ViewUser): Observable<User> {
        return null;
    }

    public createViewModel(user: User): ViewUser {
        const groups = this.DS.getMany(Group, user.groups_id);
        return new ViewUser(user, groups);
    }
}
