import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { CollectionStringMapperService } from 'app/core/core-services/collection-string-mapper.service';
import { ConstantsService } from 'app/core/core-services/constants.service';
import { DataSendService } from 'app/core/core-services/data-send.service';
import { DataStoreService } from 'app/core/core-services/data-store.service';
import { HttpService } from 'app/core/core-services/http.service';
import { RelationManagerService } from 'app/core/core-services/relation-manager.service';
import { ViewModelStoreService } from 'app/core/core-services/view-model-store.service';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Config } from 'app/shared/models/core/config';
import { ConfigTitleInformation, ViewConfig } from 'app/site/config/models/view-config';

/**
 * Holds a single config item.
 */
interface ConfigItem {
    /**
     * The key of this config variable.
     */
    key: string;

    /**
     * The actual view config for this variable.
     */
    config: ViewConfig;

    /**
     * The config variable data given in the constants. This is hold here, so the view
     * config can be updated with this data.
     */
    data: any;
}

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
    items: ConfigItem[];
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

    /**
     * A list of config items that are not in any subgroup.
     */
    items: ConfigItem[];
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
    private configs: ConfigGroup[] = null;

    /**
     * Own subject for config groups.
     */
    protected configListSubject: BehaviorSubject<ConfigGroup[]> = new BehaviorSubject<ConfigGroup[]>(null);

    /**
     * Saves, if we got config variables (the structure) from the server.
     */
    protected gotConfigsVariables = false;

    /**
     * Saves, if we got first configs via autoupdate or cache.
     */
    protected gotFirstUpdate = false;

    /**
     * Constructor for ConfigRepositoryService. Requests the constants from the server and creates the config group structure.
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
        private constantsService: ConstantsService,
        private http: HttpService
    ) {
        super(DS, dataSend, mapperService, viewModelStoreService, translate, relationManager, Config);

        this.constantsService.get('ConfigVariables').subscribe(constant => {
            this.createConfigStructure(constant);
            this.updateConfigStructure(false, ...Object.values(this.viewModelStore));
            this.gotConfigsVariables = true;
            this.checkConfigStructure();
            this.updateConfigListObservable();
        });
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

    public changedModels(ids: number[]): void {
        super.changedModels(ids);

        ids.forEach(id => {
            this.updateConfigStructure(false, this.viewModelStore[id]);
        });
        this.gotFirstUpdate = true;
        this.checkConfigStructure();
        this.updateConfigListObservable();
    }

    /**
     * Custom observer for the config
     */
    public getConfigListObservable(): Observable<ConfigGroup[]> {
        return this.configListSubject.asObservable();
    }

    /**
     * Custom notification for the observers.
     */
    protected updateConfigListObservable(): void {
        if (this.configs) {
            this.configListSubject.next(this.configs);
        }
    }

    /**
     * Getter for the config structure
     */
    public getConfigStructure(): ConfigGroup[] {
        return this.configs;
    }

    /**
     * Checks the config structure, if we got configs (first data) and the
     * structure (config variables)
     */
    protected checkConfigStructure(): void {
        if (this.gotConfigsVariables && this.gotFirstUpdate) {
            this.updateConfigStructure(true, ...Object.values(this.viewModelStore));
        }
    }

    /**
     * With a given (and maybe partially filled) config structure, all given view configs are put into it.
     * @param check Whether to check, if all given configs are there (according to the config structure).
     * If check is true and one viewConfig is missing, the user will get an error message.
     * @param viewConfigs All view configs to put into the structure
     */
    protected updateConfigStructure(check: boolean, ...viewConfigs: ViewConfig[]): void {
        if (!this.configs) {
            return;
        }

        // Map the viewConfigs to their keys.
        const keyConfigMap: { [key: string]: ViewConfig } = {};
        viewConfigs.forEach(viewConfig => {
            keyConfigMap[viewConfig.key] = viewConfig;
        });

        // traverse through configs structure and replace all given viewConfigs
        for (const group of this.configs) {
            for (const subgroup of group.subgroups) {
                for (const item of subgroup.items) {
                    if (keyConfigMap[item.key]) {
                        keyConfigMap[item.key].setConstantsInfo(item.data);
                        item.config = keyConfigMap[item.key];
                    } else if (check) {
                        throw new Error(
                            `No config variable found for "${item.key}". Please migrate the database or rebuild the servercache.`
                        );
                    }
                }
            }
            for (const item of group.items) {
                if (keyConfigMap[item.key]) {
                    keyConfigMap[item.key].setConstantsInfo(item.data);
                    item.config = keyConfigMap[item.key];
                } else if (check) {
                    throw new Error(
                        `No config variable found for "${item.key}". Please migrate the database or rebuild the servercache.`
                    );
                }
            }
        }
    }

    /**
     * Saves a config value.
     */
    public async update(config: Partial<Config>, viewConfig: ViewConfig): Promise<void> {
        const updatedConfig = viewConfig.getUpdatedModel(config);
        await this.http.put(`/rest/${updatedConfig.collectionString}/${updatedConfig.key}/`, updatedConfig);
    }

    /**
     * initially create the config structure from the given constant.
     * @param constant
     */
    private createConfigStructure(constant: any): void {
        this.configs = [];
        for (const group of constant) {
            const _group: ConfigGroup = {
                name: group.name,
                subgroups: [],
                items: []
            };
            // The server always sends subgroups. But if it has an empty name, there is no subgroup..
            for (const subgroup of group.subgroups) {
                if (subgroup.name) {
                    const _subgroup: ConfigSubgroup = {
                        name: subgroup.name,
                        items: []
                    };
                    for (const item of subgroup.items) {
                        _subgroup.items.push({
                            key: item.key,
                            config: null,
                            data: item
                        });
                    }
                    _group.subgroups.push(_subgroup);
                } else {
                    for (const item of subgroup.items) {
                        _group.items.push({
                            key: item.key,
                            config: null,
                            data: item
                        });
                    }
                }
            }
            this.configs.push(_group);
        }
    }
}
