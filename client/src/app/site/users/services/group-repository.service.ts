import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ViewGroup } from '../models/view-group';
import { BaseRepository } from '../../base/base-repository';
import { Group } from '../../../shared/models/users/group';
import { DataStoreService } from '../../../core/services/data-store.service';
import { DataSendService } from '../../../core/services/data-send.service';
import { ConstantsService } from '../../../core/services/constants.service';

/**
 * Set rules to define the shape of an app permission
 */
interface AppPermission {
    name: string;
    permissions: string[];
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
     * @param DS Store
     * @param dataSend Sending Data
     */
    public constructor(DS: DataStoreService, private dataSend: DataSendService, private constants: ConstantsService) {
        super(DS, Group);
        this.sortPermsPerApp();
    }

    /**
     * Add an entry to appPermissions
     *
     * @param appId number that indicates the app
     * @param perm certain permission as string
     * @param appName Indicates the header in the Permission Matrix
     */
    private addAppPerm(appId: number, perm: string, appName: string): void {
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
        this.constants.get('permissions').subscribe(perms => {
            perms.forEach(perm => {
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
                        this.addAppPerm(3, perm, 'Assignments');
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
            });
        });
    }

    /**
     * creates and saves a new user
     *
     * @param groupData form value. Usually not yet a real user
     */
    public create(groupData: Partial<Group>): Observable<any> {
        const newGroup = new Group();
        newGroup.patchValues(groupData);
        return this.dataSend.createModel(newGroup);
    }

    /**
     * Updates the given Group with the new permission
     *
     * @param permission the new permission
     * @param viewGroup the selected Group
     */
    public update(groupData: Partial<Group>, viewGroup: ViewGroup): Observable<any> {
        const updateGroup = new Group();
        updateGroup.patchValues(viewGroup.group);
        updateGroup.patchValues(groupData);
        return this.dataSend.updateModel(updateGroup, 'put');
    }

    /**
     * Deletes a given group
     */
    public delete(viewGroup: ViewGroup): Observable<any> {
        return this.dataSend.delete(viewGroup.group);
    }

    public createViewModel(group: Group): ViewGroup {
        return new ViewGroup(group);
    }
}
