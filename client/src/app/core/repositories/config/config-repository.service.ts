import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Config } from 'app/shared/models/core/config';
import { ConfigItem } from 'app/site/config/components/config-list/config-list.component';
import { ConfigTitleInformation, ViewConfig } from 'app/site/config/models/view-config';

/**
 * Represents a config subgroup. It can only holds items and no further groups.
 */
interface ConfigSubgroup {
    /**
     * The name.
     */
    name: string;

    /**
     * All items in this sub group.
     */
    configs: ViewConfig[];
}

/**
 * Represents a config group with its name, subgroups and direct items.
 */
export interface ConfigGroup {
    /**
     * The name.
     */
    name: string;

    /**
     * A list of subgroups.
     */
    subgroups: ConfigSubgroup[];
}

/**
 * Repository for Configs. It overrides some functions of the BaseRepository. So do not use the
 * observables given by the base repository, but the {@method getConfigListObservable}.
 */
@Injectable({
    providedIn: 'root'
})
export class ConfigRepositoryService extends BaseRepository<ViewConfig, Config, ConfigTitleInformation> {
    /**
     * Own store for config groups.
     */
    private configs: ConfigGroup[] | null = null;

    /**
     * Own subject for config groups.
     */
    private readonly configsSubject: BehaviorSubject<ConfigGroup[]> = new BehaviorSubject<ConfigGroup[]>(null);

    /**
     * Custom observer for the config
     */
    public get configsObservable(): Observable<ConfigGroup[]> {
        return this.configsSubject.asObservable();
    }

    /**
     * Gets an observalble for all existing (main) config groups. Just the group names
     * are given with this observable.
     */
    public get availableGroupsOberservable(): Observable<string[]> {
        return this.configsSubject.pipe(map((groups: ConfigGroup[]) => groups.map(group => group.name)));
    }

    /**
     * Constructor for ConfigRepositoryService. Requests the constants from the server and creates the config
     * group structure.
     *
     * @param DS The DataStore
     * @param mapperService Maps collection strings to classes
     * @param dataSend sending changed objects
     * @param http OpenSlides own HTTP Service
     */
    public constructor(
        DS: DataStoreService,
        dataSend: DataSendService,
        mapperService: CollectionStringMapperService,
        viewModelStoreService: ViewModelStoreService,
        translate: TranslateService,
        relationManager: RelationManagerService,
        private http: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Config);

        this.setSortFunction((a, b) => a.weight - b.weight);

        this.getViewModelListObservable().subscribe(configs =>
            this.updateConfigStructure(configs.filter(config => !config.hidden))
        );
    }

    public getVerboseName = (plural: boolean = false) => {
        return this.translate.instant(plural ? 'Configs' : 'Config');
    };

    public getTitle = (titleInformation: ConfigTitleInformation) => {
        return titleInformation.key;
    };

    /**
     * Overwrites the default delete procedure
     *
     * @ignore
     */
    public async delete(): Promise<void> {
        throw new Error('Config variables cannot be deleted');
    }

    /**
     * Overwrite the default create procedure.
     *
     * @ignore
     */
    public async create(): Promise<Identifiable> {
        throw new Error('Config variables cannot be created');
    }

    /**
     * Custom notification for the observers.
     */
    protected updateConfigListObservable(): void {
        if (this.configs) {
            this.configsSubject.next(this.configs);
        }
    }

    public getConfigGroupOberservable(name: string): Observable<ConfigGroup> {
        return this.configsSubject.pipe(
            map((groups: ConfigGroup[]) => groups.find(group => group.name.toLowerCase() === name))
        );
    }

    protected updateConfigStructure(configs: ViewConfig[]): void {
        const groups: ConfigGroup[] = [];

        configs.forEach(config => {
            if (groups.length === 0 || groups[groups.length - 1].name !== config.group) {
                groups.push({
                    name: config.group,
                    subgroups: []
                });
            }

            const subgroupsLength = groups[groups.length - 1].subgroups.length;
            if (
                subgroupsLength === 0 ||
                groups[groups.length - 1].subgroups[subgroupsLength - 1].name !== config.subgroup
            ) {
                groups[groups.length - 1].subgroups.push({
                    name: config.subgroup,
                    configs: []
                });
            }
            groups[groups.length - 1].subgroups[groups[groups.length - 1].subgroups.length - 1].configs.push(config);
        });

        this.configsSubject.next(groups);
    }

    /**
     * Saves a config value. The server needs the key instead of the id to fetch the config variable.
     */
    public async update(config: Partial<Config>, viewConfig: ViewConfig): Promise<void> {
        const updatedConfig = viewConfig.getUpdatedModel(config);
        await this.http.put(`/rest/${updatedConfig.collectionString}/${updatedConfig.key}/`, updatedConfig);
    }

    /**
     * Function to update multiple settings.
     *
     * @param configItems An array of `ConfigItem` with the key of the changed setting and the value for that setting.
     *
     * @returns Either a promise containing errors or null, if there are no errors.
     */
    public async bulkUpdate(configItems: ConfigItem[]): Promise<{ errors: { [key: string]: string } } | null> {
        return await this.http.post(`/rest/core/config/bulk_update/`, configItems);
    }

    /**
     * Function to send a `reset`-poll for every group to the server.
     *
     * @param groups The names of the groups, that should be updated.
     *
     * @returns The answer of the server.
     */
    public async resetGroups(groups: string[]): Promise<void> {
        return await this.http.post(`/rest/core/config/reset_groups/`, groups);
    }
}
