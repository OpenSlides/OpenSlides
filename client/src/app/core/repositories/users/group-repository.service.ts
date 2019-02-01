import { Injectable } from '@angular/core';

import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collectionStringMapper.service';
import { ConstantsService } from '../../ui-services/constants.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';
import { Group } from 'app/shared/models/users/group';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';

/**
 * Shape of a permission
 */
interface Permission {
    display_name: string;
    value: string;
}

/**
 * Set rules to define the shape of an app permission
 */
interface AppPermission {
    name: string;
    permissions: Permission[];
}

/**
 * Repository service for Groups
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class GroupRepositoryService extends BaseRepository<ViewGroup, Group> {
    /**
     * holds sorted permissions per app.
     */
    public appPermissions: AppPermission[] = [];

    /**
     * Constructor calls the parent constructor
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param constants reading out the OpenSlides constants
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        private dataSend: DataSendService,
        private constants: ConstantsService
    ) {
        super(DS, mapperService, viewModelStoreService, Group);
        this.sortPermsPerApp();
    }

    /**
     * Add an entry to appPermissions
     *
     * @param appId number that indicates the app
     * @param perm certain permission as string
     * @param appName Indicates the header in the Permission Matrix
     */
    private addAppPerm(appId: number, perm: Permission, appName: string): void {
        if (!this.appPermissions[appId]) {
            this.appPermissions[appId] = {
                name: appName,
                permissions: []
            };
        }
        this.appPermissions[appId].permissions.push(perm);
    }

    /**
     * read the constants, add them to an array of apps
     */
    private sortPermsPerApp(): void {
        this.constants.get<any>('permissions').subscribe(perms => {
            for (const perm of perms) {
                // extract the apps name
                const permApp = perm.value.split('.')[0];
                switch (permApp) {
                    case 'core':
                        if (perm.value.indexOf('projector') > -1) {
                            this.addAppPerm(0, perm, 'Projector');
                        } else {
                            this.addAppPerm(6, perm, 'General');
                        }
                        break;
                    case 'agenda':
                        this.addAppPerm(1, perm, 'Agenda');
                        break;
                    case 'motions':
                        this.addAppPerm(2, perm, 'Motions');
                        break;
                    case 'assignments':
                        this.addAppPerm(3, perm, 'Elections');
                        break;
                    case 'mediafiles':
                        this.addAppPerm(4, perm, 'Mediafiles');
                        break;
                    case 'users':
                        this.addAppPerm(5, perm, 'Users');
                        break;
                    default:
                        // plugins
                        const displayName = `${permApp.charAt(0).toUpperCase}${permApp.slice(1)}`;
                        // check if the plugin exists as app
                        const result = this.appPermissions.findIndex(app => {
                            return app.name === displayName;
                        });
                        const pluginId = result === -1 ? this.appPermissions.length : result;
                        this.addAppPerm(pluginId, perm, displayName);
                        break;
                }
            }
            this.sortPermsByPower();
        });
    }

    /**
     * sort each app: first all permission with 'see', then 'manage', then the rest
     * save the permissions in different lists an concat them in the right order together
     * Special Users: the two "see"-permissions are normally swapped. To create the right
     * order, we could simply reverse the whole permissions.
     */
    private sortPermsByPower(): void {
        this.appPermissions.forEach((app: AppPermission, index: number) => {
            if (index === 5) {
                app.permissions.reverse();
            } else {
                const see = [];
                const manage = [];
                const others = [];
                for (const perm of app.permissions) {
                    if (perm.value.indexOf('see') > -1) {
                        see.push(perm);
                    } else if (perm.value.indexOf('manage') > -1) {
                        manage.push(perm);
                    } else {
                        others.push(perm);
                    }
                }
                app.permissions = see.concat(manage.concat(others));
            }
        });
    }

    /**
     * creates and saves a new user
     *
     * @param groupData form value. Usually not yet a real user
     */
    public async create(groupData: Partial<Group>): Promise<Identifiable> {
        const newGroup = new Group();
        newGroup.patchValues(groupData);
        return await this.dataSend.createModel(newGroup);
    }

    /**
     * Updates the given Group with the new permission
     *
     * @param permission the new permission
     * @param viewGroup the selected Group
     */
    public async update(groupData: Partial<Group>, viewGroup: ViewGroup): Promise<void> {
        const updateGroup = new Group();
        updateGroup.patchValues(viewGroup.group);
        updateGroup.patchValues(groupData);
        await this.dataSend.updateModel(updateGroup);
    }

    /**
     * Deletes a given group
     */
    public async delete(viewGroup: ViewGroup): Promise<void> {
        await this.dataSend.deleteModel(viewGroup.group);
    }

    public createViewModel(group: Group): ViewGroup {
        return new ViewGroup(group);
    }
}
