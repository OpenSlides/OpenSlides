import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

import { Group } from 'app/shared/models/users/group';
import { User } from '../../shared/models/users/user';
import { environment } from 'environments/environment';
import { DataStoreService } from './data-store.service';
import { OfflineService } from './offline.service';
import { OpenSlidesStatusService } from './openslides-status.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { OnAfterAppsLoaded } from '../onAfterAppsLoaded';
import { UserRepositoryService } from '../repositories/users/user-repository.service';
import { CollectionStringMapperService } from './collectionStringMapper.service';
import { StorageService } from './storage.service';
import { HttpService } from './http.service';
import { filter, auditTime } from 'rxjs/operators';

/**
 * Permissions on the client are just strings. This makes clear, that
 * permissions instead of arbitrary strings should be given.
 */
export type Permission = string;

/**
 * Response format of the WhoAmI request.
 */
export interface WhoAmI {
    user_id: number;
    guest_enabled: boolean;
    user: User;
    permissions: Permission[];
}

function isWhoAmI(obj: any): obj is WhoAmI {
    if (!obj) {
        return false;
    }
    const whoAmI = obj as WhoAmI;
    return (
        whoAmI.guest_enabled !== undefined &&
        whoAmI.user !== undefined &&
        whoAmI.user_id !== undefined &&
        whoAmI.permissions !== undefined
    );
}

const WHOAMI_STORAGE_KEY = 'whoami';

/**
 * The operator represents the user who is using OpenSlides.
 *
 * Changes in operator can be observed, directives do so on order to show
 * or hide certain information.
 */
@Injectable({
    providedIn: 'root'
})
export class OperatorService implements OnAfterAppsLoaded {
    /**
     * The operator.
     */
    private _user: User;

    public get user(): User {
        return this._user;
    }

    /**
     * The operator as a view user. We need a separation here, because
     * we need to acces the operators permissions, before we get data
     * from the server to build the view user.
     */
    private _viewUser: ViewUser;

    /**
     * Get the user that corresponds to operator.
     */
    public get viewUser(): ViewUser {
        return this._viewUser;
    }

    public get isAnonymous(): boolean {
        return !this.user || this.user.id === 0;
    }

    /**
     * Save, if guests are enabled.
     */
    public get guestsEnabled(): boolean {
        return this.currentWhoAmI ? this.currentWhoAmI.guest_enabled : false;
    }

    /**
     * The permissions of the operator. Updated via {@method updatePermissions}.
     */
    private permissions: Permission[] = [];

    /**
     * The subject that can be observed by other instances using observing functions.
     */
    private operatorSubject: BehaviorSubject<User> = new BehaviorSubject<User>(null);

    /**
     * Subject for the operator as a view user.
     */
    private viewOperatorSubject: BehaviorSubject<ViewUser> = new BehaviorSubject<ViewUser>(null);

    /**
     * Do not access the repo before it wasn't loaded. Will be true after `onAfterAppsLoaded`.
     */
    private userRepository: UserRepositoryService | null;

    /**
     * The current WhoAmI response to extract the user (the operator) from.
     */
    private currentWhoAmI: WhoAmI | null;

    /**
     * Sets up an observer for watching changes in the DS. If the operator user or groups are changed,
     * the operator's permissions are updated.
     *
     * @param http
     * @param DS
     * @param offlineService
     */
    public constructor(
        private http: HttpService,
        private DS: DataStoreService,
        private offlineService: OfflineService,
        private collectionStringMapper: CollectionStringMapperService,
        private storageService: StorageService,
        private OSStatus: OpenSlidesStatusService
    ) {
        this.DS.changeObservable.subscribe(newModel => {
            if (this._user && newModel instanceof User && this._user.id === newModel.id) {
                this._user = newModel;
                this.updateUserInCurrentWhoAmI();
            }
        });
        this.DS.changeObservable
            .pipe(
                filter(
                    model =>
                        // Any group has changed if we have an operator or
                        // group 1 (default) for anonymous changed
                        model instanceof Group && (!!this._user || model.id === 1)
                ),
                auditTime(10)
            )
            .subscribe(newModel => this.updatePermissions());
    }

    /**
     * Returns a default WhoAmI response
     */
    private getDefaultWhoAmIResponse(): WhoAmI {
        return {
            user_id: null,
            guest_enabled: false,
            user: null,
            permissions: []
        };
    }

    /**
     * Gets the current WhoAmI response from the storage.
     */
    public async whoAmIFromStorage(): Promise<WhoAmI> {
        let response: WhoAmI;
        try {
            response = await this.storageService.get<WhoAmI>(WHOAMI_STORAGE_KEY);
            if (!response) {
                response = this.getDefaultWhoAmIResponse();
            }
        } catch (e) {
            response = this.getDefaultWhoAmIResponse();
        }
        await this.updateCurrentWhoAmI(response);
        return this.currentWhoAmI;
    }

    /**
     * Load the repo to get a view user.
     */
    public onAfterAppsLoaded(): void {
        this.userRepository = this.collectionStringMapper.getRepository(ViewUser) as UserRepositoryService;
        if (this.user) {
            this._viewUser = this.userRepository.getViewModel(this.user.id);
        }
    }

    /**
     * Sets the operator user. Will be saved to storage
     * @param user The new operator.
     */
    public async setWhoAmI(whoami: WhoAmI | null): Promise<void> {
        if (whoami === null) {
            whoami = this.getDefaultWhoAmIResponse();
        }
        await this.updateCurrentWhoAmI(whoami);
    }

    /**
     * Calls `/apps/users/whoami` to find out the real operator.
     *
     * @returns The response of the WhoAmI request.
     */
    public async whoAmI(): Promise<WhoAmI> {
        try {
            const response = await this.http.get(environment.urlPrefix + '/users/whoami/');
            if (isWhoAmI(response)) {
                await this.updateCurrentWhoAmI(response);
            } else {
                this.offlineService.goOfflineBecauseFailedWhoAmI();
            }
        } catch (e) {
            this.offlineService.goOfflineBecauseFailedWhoAmI();
        }
        return this.currentWhoAmI;
    }

    /**
     * Saves the user to storage by wrapping it into a (maybe existing)
     * WhoAMI response.
     */
    private async updateUserInCurrentWhoAmI(): Promise<void> {
        if (!this.currentWhoAmI) {
            this.currentWhoAmI = this.getDefaultWhoAmIResponse();
        }
        if (this.isAnonymous) {
            this.currentWhoAmI.user_id = null;
            this.currentWhoAmI.user = null;
        } else {
            this.currentWhoAmI.user_id = this.user.id;
            this.currentWhoAmI.user = this.user;
        }
        this.currentWhoAmI.permissions = this.permissions;
        await this.updateCurrentWhoAmI();
    }

    /**
     * Updates the user and update the permissions.
     */
    private async updateCurrentWhoAmI(whoami?: WhoAmI): Promise<void> {
        if (whoami) {
            this.currentWhoAmI = whoami;
        } else {
            whoami = this.currentWhoAmI;
        }

        this._user = whoami ? whoami.user : null;
        if (this._user && this.userRepository) {
            this._viewUser = this.userRepository.getViewModel(this._user.id);
        } else {
            this._viewUser = null;
        }
        await this.updatePermissions();
    }

    /**
     * @returns an observable for the operator as a user.
     */
    public getUserObservable(): Observable<User> {
        return this.operatorSubject.asObservable();
    }

    /**
     * @returns an observable for the operator as a viewUser. Note, that
     * the viewUser might not be there, so for reliable (and not display) information,
     * use the `getUserObservable`.
     */
    public getViewUserObservable(): Observable<ViewUser> {
        return this.viewOperatorSubject.asObservable();
    }

    /**
     * Checks, if the operator has at least one of the given permissions.
     * @param checkPerms The permissions to check, if at least one matches.
     */
    public hasPerms(...checkPerms: Permission[]): boolean {
        if (this._user && this._user.groups_id.includes(2)) {
            return true;
        }
        return checkPerms.some(permission => {
            return this.permissions.includes(permission);
        });
    }

    /**
     * Returns true, if the operator is in at least one group or he is in the admin group.
     * @param groups The groups to check
     */
    public isInGroup(...groups: Group[]): boolean {
        return this.isInGroupIds(...groups.map(group => group.id));
    }

    /**
     * Returns true, if the operator is in at least one group or he is in the admin group.
     * @param groups The group ids to check
     */
    public isInGroupIds(...groupIds: number[]): boolean {
        if (!this.user) {
            return groupIds.includes(1); // any anonymous is in the default group.
        }
        if (this.user.groups_id.includes(2)) {
            // An admin has all perms and is technically in every group.
            return true;
        }
        return groupIds.some(id => this.user.groups_id.includes(id));
    }

    /**
     * Update the operators permissions and publish the operator afterwards.
     * Saves the current WhoAmI to storage with the updated permissions
     */
    private async updatePermissions(): Promise<void> {
        this.permissions = [];

        // If we do not have any groups, take the permissions from the
        // latest WhoAmI response.
        if (this.DS.getAll(Group).length === 0) {
            if (this.currentWhoAmI) {
                this.permissions = this.currentWhoAmI.permissions;
            }
        } else {
            // Anonymous or users in the default group.
            if (!this.user || this.user.groups_id.length === 0) {
                const defaultGroup = this.DS.get<Group>('users/group', 1);
                if (defaultGroup && defaultGroup.permissions instanceof Array) {
                    this.permissions = defaultGroup.permissions;
                }
            } else {
                const permissionSet = new Set();
                this.DS.getMany(Group, this.user.groups_id).forEach(group => {
                    group.permissions.forEach(permission => {
                        permissionSet.add(permission);
                    });
                });
                this.permissions = Array.from(permissionSet.values());
            }
        }

        // Save perms to current WhoAmI
        if (!this.currentWhoAmI) {
            this.currentWhoAmI = this.getDefaultWhoAmIResponse();
        }
        this.currentWhoAmI.permissions = this.permissions;

        if (!this.OSStatus.isInHistoryMode) {
            await this.storageService.set(WHOAMI_STORAGE_KEY, this.currentWhoAmI);
        }

        // publish changes in the operator.
        this.operatorSubject.next(this.user);
        this.viewOperatorSubject.next(this.viewUser);
    }
}
