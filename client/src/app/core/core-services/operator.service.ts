import { Injectable } from '@angular/core';

import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { auditTime, filter } from 'rxjs/operators';

import { Group } from 'app/shared/models/users/group';
import { ViewUser } from 'app/site/users/models/view-user';
import { CollectionStringMapperService } from './collection-string-mapper.service';
import { DataStoreService } from './data-store.service';
import { Deferred } from '../promises/deferred';
import { HttpService } from './http.service';
import { OnAfterAppsLoaded } from '../definitions/on-after-apps-loaded';
import { OpenSlidesStatusService } from './openslides-status.service';
import { StorageService } from './storage.service';
import { DEFAULT_AUTH_TYPE, User, UserAuthType } from '../../shared/models/users/user';
import { UserRepositoryService } from '../repositories/users/user-repository.service';

/**
 * Permissions on the client are just strings. This makes clear, that
 * permissions instead of arbitrary strings should be given.
 */
export enum Permission {
    agendaCanManage = 'agenda.can_manage',
    agendaCanSee = 'agenda.can_see',
    agendaCanSeeInternalItems = 'agenda.can_see_internal_items',
    agendaCanManageListOfSpeakers = 'agenda.can_manage_list_of_speakers',
    agendaCanSeeListOfSpeakers = 'agenda.can_see_list_of_speakers',
    agendaCanBeSpeaker = 'agenda.can_be_speaker',
    assignmentsCanManage = 'assignments.can_manage',
    assignmentsCanNominateOther = 'assignments.can_nominate_other',
    assignmentsCanNominateSelf = 'assignments.can_nominate_self',
    assignmentsCanSee = 'assignments.can_see',
    coreCanManageConfig = 'core.can_manage_config',
    coreCanManageLogosAndFonts = 'core.can_manage_logos_and_fonts',
    coreCanSeeHistory = 'core.can_see_history',
    coreCanManageProjector = 'core.can_manage_projector',
    coreCanSeeFrontpage = 'core.can_see_frontpage',
    coreCanSeeProjector = 'core.can_see_projector',
    coreCanManageTags = 'core.can_manage_tags',
    coreCanSeeLiveStream = 'core.can_see_livestream',
    coreCanSeeAutopilot = 'core.can_see_autopilot',
    mediafilesCanManage = 'mediafiles.can_manage',
    mediafilesCanSee = 'mediafiles.can_see',
    motionsCanCreate = 'motions.can_create',
    motionsCanCreateAmendments = 'motions.can_create_amendments',
    motionsCanManage = 'motions.can_manage',
    motionsCanManageMetadata = 'motions.can_manage_metadata',
    motionsCanManagePolls = 'motions.can_manage_polls',
    motionsCanSee = 'motions.can_see',
    motionsCanSeeInternal = 'motions.can_see_internal',
    motionsCanSupport = 'motions.can_support',
    usersCanChangePassword = 'users.can_change_password',
    usersCanManage = 'users.can_manage',
    usersCanSeeExtraData = 'users.can_see_extra_data',
    usersCanSeeName = 'users.can_see_name',
    chatCanManage = 'chat.can_manage'
}

/**
 * Response format of the WhoAmI request.
 */
export interface WhoAmI {
    user_id: number;
    guest_enabled: boolean;
    user: User;
    auth_type: UserAuthType;
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
        whoAmI.permissions !== undefined &&
        whoAmI.auth_type !== undefined
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

    public get isSuperAdmin(): boolean {
        return this.isInGroupIdsNonAdminCheck(2);
    }

    public readonly authType: BehaviorSubject<UserAuthType> = new BehaviorSubject(DEFAULT_AUTH_TYPE);

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

    private _currentWhoAmI: WhoAmI | null = null;
    private _defaultWhoAmI: WhoAmI = {
        user_id: null,
        guest_enabled: false,
        user: null,
        auth_type: DEFAULT_AUTH_TYPE,
        permissions: []
    };

    /**
     * The current WhoAmI response to extract the user (the operator) from.
     */
    private get currentWhoAmI(): WhoAmI {
        return this._currentWhoAmI || this._defaultWhoAmI;
    }

    private set currentWhoAmI(value: WhoAmI | null) {
        this._currentWhoAmI = value;

        // Resetting the default whoami, when the current whoami isn't there. This
        // is for a fresh restart and do not have (old) changed values in this.defaultWhoAmI
        if (!value) {
            this._defaultWhoAmI = this.getDefaultWhoAmIResponse();
        }
    }

    private readonly _loaded: Deferred<void> = new Deferred();

    public get loaded(): Promise<void> {
        return this._loaded;
    }

    /**
     * This is for the viewUser check, if the user id has changed, on a user update.
     */
    private lastUserId: number | null = null;

    /**
     * The subscription to the viewuser from the user repository.
     */
    private viewOperatorSubscription: Subscription;

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
        private collectionStringMapper: CollectionStringMapperService,
        private storageService: StorageService,
        private OSStatus: OpenSlidesStatusService
    ) {
        this.DS.getChangeObservable(User).subscribe(newModel => {
            if (this._user && this._user.id === newModel.id) {
                this._user = newModel;
                this.updateUserInCurrentWhoAmI();
            }
        });
        this.DS.getChangeObservable(Group)
            .pipe(
                filter(
                    model =>
                        // Any group has changed if we have an operator or
                        // group 1 (default) for anonymous changed
                        !!this._user || model.id === 1
                ),
                auditTime(10)
            )
            .subscribe(() => this.updatePermissions());

        // Watches the user observable to update the viewUser for the operator.
        this.getUserObservable().subscribe(user => {
            const userId = user ? user.id : null;
            if ((!user && this.lastUserId === null) || userId === this.lastUserId) {
                return; // The user didn't changed.
            }
            this.lastUserId = userId;

            // User changed: clear subscription and subscribe to the new user (if there is one)
            if (this.viewOperatorSubscription) {
                this.viewOperatorSubscription.unsubscribe();
            }

            if (user && this.userRepository) {
                this.viewOperatorSubscription = this.userRepository
                    .getViewModelObservable(user.id)
                    .subscribe(viewUser => {
                        this._viewUser = viewUser;
                        this.viewOperatorSubject.next(viewUser);
                    });
            } else {
                // The operator is anonymous.
                this.viewOperatorSubject.next(null);
            }
        });
    }

    /**
     * Load the repo to get a view user.
     */
    public onAfterAppsLoaded(): void {
        this.userRepository = this.collectionStringMapper.getRepository(ViewUser) as UserRepositoryService;
        if (this.user) {
            this._viewUser = this.userRepository.getViewModel(this.user.id);
        }
        this.viewOperatorSubject.next(this._viewUser);
    }

    /**
     * Gets the current WhoAmI response from the storage.
     */
    public async whoAmIFromStorage(): Promise<WhoAmI | null> {
        let response: WhoAmI | null = null;
        try {
            response = await this.storageService.get<WhoAmI>(WHOAMI_STORAGE_KEY);
            if (!isWhoAmI(response)) {
                response = null;
            }
        } catch (e) {}

        if (response) {
            await this.updateCurrentWhoAmI(response);
        }
        return response;
    }

    public async clearWhoAmIFromStorage(): Promise<void> {
        await this.storageService.remove(WHOAMI_STORAGE_KEY);
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
    public async whoAmI(): Promise<{ whoami: WhoAmI; online: boolean }> {
        let online = true;
        try {
            const response = await this.http.get(environment.urlPrefix + '/users/whoami/');
            if (isWhoAmI(response)) {
                await this.updateCurrentWhoAmI(response);
            } else {
                online = false;
            }
        } catch (e) {
            online = false;
        }
        return { whoami: this.currentWhoAmI, online };
    }

    /**
     * Saves the user to storage by wrapping it into a (maybe existing)
     * WhoAMI response.
     */
    private async updateUserInCurrentWhoAmI(): Promise<void> {
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
        this.authType.next(whoami ? whoami.auth_type : DEFAULT_AUTH_TYPE);
        await this.updatePermissions();
        this._loaded.resolve();
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
        if (!this.isInGroupIdsNonAdminCheck(...groupIds)) {
            // An admin has all perms and is technically in every group.
            return this.user && this.user.groups_id.includes(2);
        }
        return true;
    }

    /**
     * Returns true, if the operator is in at least one group.
     * @param groups The group ids to check
     */
    public isInGroupIdsNonAdminCheck(...groupIds: number[]): boolean {
        if (!this.user) {
            return groupIds.includes(1); // any anonymous is in the default group.
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
                const defaultGroup: Group = this.DS.get<Group>('users/group', 1);
                if (defaultGroup && defaultGroup.permissions instanceof Array) {
                    this.permissions = defaultGroup.permissions;
                }
            } else {
                const permissionSet = new Set<Permission>();
                this.DS.getMany(Group, this.user.groups_id).forEach(group => {
                    group.permissions.forEach(permission => {
                        permissionSet.add(permission);
                    });
                });
                this.permissions = Array.from(permissionSet.values());
            }
        }

        // Save perms to current WhoAmI
        this.currentWhoAmI.permissions = this.permissions;

        if (!this.OSStatus.isInHistoryMode) {
            await this.storageService.set(WHOAMI_STORAGE_KEY, this.currentWhoAmI);
        }

        // publish changes in the operator.
        this.operatorSubject.next(this.user);
    }

    /**
     * Set the operators presence to isPresent
     */
    public async setPresence(isPresent: boolean): Promise<void> {
        await this.http.post(environment.urlPrefix + '/users/setpresence/', isPresent);
    }

    /**
     * Returns a default WhoAmI response
     */
    private getDefaultWhoAmIResponse(): WhoAmI {
        return {
            user_id: null,
            guest_enabled: false,
            user: null,
            auth_type: DEFAULT_AUTH_TYPE,
            permissions: []
        };
    }
}
