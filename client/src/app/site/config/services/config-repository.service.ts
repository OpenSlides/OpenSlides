import { Injectable } from '@angular/core';

import { BaseRepository } from '../../base/base-repository';
import { ViewConfig } from '../models/view-config';
import { Config } from '../../../shared/models/core/config';
import { Observable, BehaviorSubject } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { ConstantsService } from '../../../core/services/constants.service';
import { HttpClient } from '@angular/common/http';
import { CollectionStringModelMapperService } from '../../../core/services/collectionStringModelMapper.service';
import { TranslateService } from '@ngx-translate/core';
import { PromptService } from '../../../core/services/prompt.service';

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
export class ConfigRepositoryService extends BaseRepository<ViewConfig, Config> {
    /**
     * Own store for config groups.
     */
    private configs: ConfigGroup[] = null;

    /**
     * Own subject for config groups.
     */
    protected configListSubject: BehaviorSubject<ConfigGroup[]> = new BehaviorSubject<ConfigGroup[]>(null);

    /**
     * Constructor for ConfigRepositoryService. Requests the constants from the server and creates the config group structure.
     */
    public constructor(
        DS: DataStoreService,
        mapperService: CollectionStringModelMapperService,
        translate: TranslateService,
        promptService: PromptService,
        private constantsService: ConstantsService,
        private http: HttpClient
    ) {
        super(DS, mapperService, translate, promptService, Config);

        this.constantsService.get('OpenSlidesConfigVariables').subscribe(constant => {
            this.createConfigStructure(constant);
            this.updateConfigStructure(...Object.values(this.viewModelStore));
            this.updateConfigListObservable();
        });
    }

    /**
     * Overwritten setup. Does only care about the custom list observable and inserts changed configs into the
     * config group structure.
     */
    protected setup(): void {
        if (!this.configListSubject) {
            this.configListSubject = new BehaviorSubject<ConfigGroup[]>(null);
        }

        this.DS.getAll(Config).forEach((config: Config) => {
            this.viewModelStore[config.id] = this.createViewModel(config);
            this.updateConfigStructure(this.viewModelStore[config.id]);
        });
        this.updateConfigListObservable();

        // Could be raise in error if the root injector is not known
        this.DS.changeObservable.subscribe(model => {
            if (model instanceof Config) {
                this.viewModelStore[model.id] = this.createViewModel(model as Config);
                this.updateConfigStructure(this.viewModelStore[model.id]);
                this.updateConfigListObservable();
            }
        });
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
     * With a given (and maybe partially filled) config structure, all given view configs are put into it.
     * @param viewConfigs All view configs to put into the structure
     */
    protected updateConfigStructure(...viewConfigs: ViewConfig[]): void {
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
                    }
                }
            }
            for (const item of group.items) {
                if (keyConfigMap[item.key]) {
                    keyConfigMap[item.key].setConstantsInfo(item.data);
                    item.config = keyConfigMap[item.key];
                }
            }
        }
    }

    /**
     * Saves a config value.
     */
    public update(config: Partial<Config>, viewConfig: ViewConfig): Observable<Config> {
        const updatedConfig = new Config();
        updatedConfig.patchValues(viewConfig.config);
        updatedConfig.patchValues(config);
        // TODO: Use datasendService, if it can switch correctly between put, post and patch
        return this.http.put<Config>(
            'rest/' + updatedConfig.collectionString + '/' + updatedConfig.key + '/',
            updatedConfig
        );
    }

    /**
     * This particular function should never be necessary since the deletion of config
     * values is not planed.
     *
     * Function exists solely to correctly implement {@link BaseRepository}
     */
    protected actualDelete(config: ViewConfig): Observable<void> {
        throw new Error('Config variables cannot be deleted');
    }

    /**
     * This particular function should never be necessary since the deletion of config
     * values is not planed.
     *
     * Function exists solely to correctly implement {@link BaseRepository}
     */
    public async delete(config: ViewConfig): Promise<void> {
        throw new Error('Config variables cannot be deleted');
    }

    /**
     * This particular function should never be necessary since the creation of config
     * values is not planed.
     *
     * Function exists solely to correctly implement {@link BaseRepository}
     */
    public create(config: Config): Observable<Config> {
        throw new Error('Config variables cannot be created');
    }

    /**
     * Creates a new ViewConfig of a given Config object
     * @param config
     */
    public createViewModel(config: Config): ViewConfig {
        const vm = new ViewConfig(config);
        return vm;
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
