import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpService } from 'app/core/core-services/http.service';
import { Permission } from 'app/core/core-services/operator.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { Group } from 'app/shared/models/users/group';
import { GroupTitleInformation, ViewGroup } from 'app/site/users/models/view-group';
import { BaseRepository } from '../base-repository';
import { CollectionStringMapperService } from '../../core-services/collection-string-mapper.service';
import { ConstantsService } from '../../core-services/constants.service';
import { DataSendService } from '../../core-services/data-send.service';
import { DataStoreService } from '../../core-services/data-store.service';

/**
 * Shape of a permission
 */
interface PermDefinition {
    display_name: string;
    value: Permission;
}

/**
 * Set rules to define the shape of an app permission
 */
export interface AppPermissions {
    name: string;
    permissions: PermDefinition[];
}

/**
 * Repository service for Groups
 *
 * Documentation partially provided in {@link BaseRepository}
 */
@Injectable({
    providedIn: 'root'
})
export class GroupRepositoryService extends BaseRepository<ViewGroup, Group, GroupTitleInformation> {
    /**
     * holds sorted permissions per app.
     */
    public appPermissions: AppPermissions[] = [];

    /**
     * Constructor calls the parent constructor
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param constantsService reading out the OpenSlides constants
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private constantsService: ConstantsService,
        private http: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Group);
        this.sortPermsPerApp();
    }

    public getTitle = (titleInformation: GroupTitleInformation) => {
        return titleInformation.name;
    };

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Groups' : 'Group');
    };

    public getNameForIds(...ids: number[]): string {
        return this.getSortedViewModelList()
            .filter(group => ids.includes(group.id))
            .map(group => this.translate.instant(group.getTitle()))
            .join(', ');
    }

    /**
     * Toggles the given permisson.
     *
     * @param group The group
     * @param perm The permission to toggle
     */
    public async togglePerm(group: ViewGroup, perm: Permission): Promise<void> {
        const set = !group.permissions.includes(perm);
        return await this.http.post(`/rest/${group.collectionString}/${group.id}/set_permission/`, {
            perm: perm,
            set: set
        });
    }

    /**
     * Add an entry to appPermissions
     *
     * @param appId number that indicates the app
     * @param perm certain permission as string
     * @param appName Indicates the header in the Permission Matrix
     */
    private addAppPerm(appId: number, perm: PermDefinition, appName: string): void {
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
        this.constantsService.get<any>('Permissions').subscribe(perms => {
            this.appPermissions = [];
            let pluginCounter = 0;
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
                        this.addAppPerm(4, perm, 'Files');
                        break;
                    case 'users':
                        this.addAppPerm(5, perm, 'Participants');
                        break;
                    default:
                        // plugins
                        const displayName = `${permApp.charAt(0).toUpperCase()}${permApp.slice(1)}`;
                        // check if the plugin exists as app. The appPermissions array might have empty
                        // entries, so pay attention in the findIndex below.
                        const result = this.appPermissions.findIndex(app => {
                            return app ? app.name === displayName : false;
                        });
                        let pluginId: number;
                        if (result >= 0) {
                            pluginId = result;
                        } else {
                            // Ensure plugins to be behind the 7 core apps.
                            pluginId = pluginCounter + 7;
                            pluginCounter++;
                        }
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
        this.appPermissions.forEach((app: AppPermissions) => {
            if (app.name === 'Users') {
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
     * Returns an Observable for all groups except the default group.
     */
    public getViewModelListObservableWithoutDefaultGroup(): Observable<ViewGroup[]> {
        // since groups are sorted by id, default is always the first entry
        return this.getViewModelListObservable().pipe(map(groups => groups.slice(1)));
    }
}
