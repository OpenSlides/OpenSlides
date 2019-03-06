import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

import { Group } from 'app/shared/models/users/group';
import { User } from '../../shared/models/users/user';
import { environment } from 'environments/environment';
import { DataStoreService } from './data-store.service';
import { OfflineService } from './offline.service';
import { ViewUser } from 'app/site/users/models/view-user';
import { OnAfterAppsLoaded } from '../onAfterAppsLoaded';
import { UserRepositoryService } from '../repositories/users/user-repository.service';
import { CollectionStringMapperService } from './collectionStringMapper.service';
import { StorageService } from './storage.service';
import { HttpService } from './http.service';

/**
 * Permissions on the client are just strings. This makes clear, that
 * permissions instead of arbitrary strings should be given.
 */
export type Permission = string;

/**
 * Response format of the WhoAmI request.
 */
export interface WhoAmIResponse {
    user_id: number;
    guest_enabled: boolean;
    user: User;
}

function isWhoAmIResponse(obj: any): obj is WhoAmIResponse {
    if (!obj) {
        return false;
    }
    const whoAmI = obj as WhoAmIResponse;
    return whoAmI.guest_enabled !== undefined && whoAmI.user !== undefined && whoAmI.user_id !== undefined;
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
        return this.currentWhoAmIResponse ? this.currentWhoAmIResponse.guest_enabled : false;
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
    private currentWhoAmIResponse: WhoAmIResponse | null;

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
        private storageService: StorageService
    ) {
        this.DS.changeObservable.subscribe(newModel => {
            if (this._user) {
                if (newModel instanceof Group) {
                    this.updatePermissions();
                }

                if (newModel instanceof User && this._user.id === newModel.id) {
                    this.updateUser(newModel);
                }
            } else if (newModel instanceof Group && newModel.id === 1) {
                // Group 1 (default) for anonymous changed
                this.updatePermissions();
            }
        });
    }

    /**
     * Gets the current WHoAmI response from the storage.
     */
    public async whoAmIFromStorage(): Promise<WhoAmIResponse> {
        const defaultResponse = {
            user_id: null,
            guest_enabled: false,
            user: null
        };
        let response: WhoAmIResponse;
        try {
            response = await this.storageService.get<WhoAmIResponse>(WHOAMI_STORAGE_KEY);
            if (response) {
                this.processWhoAmIResponse(response);
            } else {
                response = defaultResponse;
            }
        } catch (e) {
            response = defaultResponse;
        }
        this.currentWhoAmIResponse = response;
        return this.currentWhoAmIResponse;
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
    public async setUser(user: User): Promise<void> {
        await this.updateUser(user, true);
    }

    /**
     * Updates the user and update the permissions.
     *
     * @param user The user to set.
     * @param saveToStoare Whether to save the user to the storage WhoAmI.
     */
    private async updateUser(user: User | null, saveToStorage: boolean = false): Promise<void> {
        this._user = user;
        if (saveToStorage) {
            await this.saveUserToStorate();
        }
        if (user && this.userRepository) {
            this._viewUser = this.userRepository.getViewModel(user.id);
        } else {
            this._viewUser = null;
        }
        this.updatePermissions();
    }

    /**
     * Calls `/apps/users/whoami` to find out the real operator.
     *
     * @returns The response of the WhoAmI request.
     */
    public async whoAmI(): Promise<WhoAmIResponse> {
        try {
            const response = await this.http.get(environment.urlPrefix + '/users/whoami/');
            if (isWhoAmIResponse(response)) {
                this.processWhoAmIResponse(response);
                await this.storageService.set(WHOAMI_STORAGE_KEY, response);
                this.currentWhoAmIResponse = response;
            } else {
                this.offlineService.goOfflineBecauseFailedWhoAmI();
            }
        } catch (e) {
            this.offlineService.goOfflineBecauseFailedWhoAmI();
        }
        return this.currentWhoAmIResponse;
    }

    /**
     * Saves the user to storage by wrapping it into a (maybe existing)
     * WhoAMI response.
     */
    private async saveUserToStorate(): Promise<void> {
        if (!this.currentWhoAmIResponse) {
            this.currentWhoAmIResponse = {
                user_id: null,
                guest_enabled: false,
                user: null
            };
        }
        if (this.user) {
            this.currentWhoAmIResponse.user_id = this.user.id;
            this.currentWhoAmIResponse.user = this.user;
        } else {
            this.currentWhoAmIResponse.user_id = null;
            this.currentWhoAmIResponse.user = null;
        }
        await this.storageService.set(WHOAMI_STORAGE_KEY, this.currentWhoAmIResponse);
    }

    /**
     * Processes a WhoAmI response and set the user appropriately.
     *
     * @param response The WhoAMI response
     */
    private processWhoAmIResponse(response: WhoAmIResponse): void {
        this.updateUser(response.user ? new User(response.user) : null);
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
     */
    private updatePermissions(): void {
        this.permissions = [];
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
        // publish changes in the operator.
        this.operatorSubject.next(this.user);
        this.viewOperatorSubject.next(this.viewUser);
    }
}
