import { Injectable, Injector } from '@angular/core';

import { plugins } from '../../../plugins';
import { CommonAppConfig } from '../../site/common/common.config';
import { AppConfig, SearchableModelEntry, ModelEntry } from '../app-config';
import { CollectionStringMapperService } from './collection-string-mapper.service';
import { MediafileAppConfig } from '../../site/mediafiles/mediafile.config';
import { MotionsAppConfig } from '../../site/motions/motions.config';
import { ConfigAppConfig } from '../../site/config/config.config';
import { AgendaAppConfig } from '../../site/agenda/agenda.config';
import { AssignmentsAppConfig } from '../../site/assignments/assignments.config';
import { UsersAppConfig } from '../../site/users/users.config';
import { TagAppConfig } from '../../site/tags/tag.config';
import { MainMenuService } from './main-menu.service';
import { HistoryAppConfig } from 'app/site/history/history.config';
import { SearchService } from '../ui-services/search.service';
import { isSearchable } from '../../site/base/searchable';
import { ProjectorAppConfig } from 'app/site/projector/projector.config';
import { BaseRepository } from 'app/core/repositories/base-repository';
import { OnAfterAppsLoaded } from '../onAfterAppsLoaded';
import { ServicesToLoadOnAppsLoaded } from '../core.module';

/**
 * A list of all app configurations of all delivered apps.
 */
const appConfigs: AppConfig[] = [
    CommonAppConfig,
    ConfigAppConfig,
    AgendaAppConfig,
    AssignmentsAppConfig,
    MotionsAppConfig,
    MediafileAppConfig,
    TagAppConfig,
    UsersAppConfig,
    HistoryAppConfig,
    ProjectorAppConfig
];

/**
 * Handles loading of all apps during the bootup process.
 */
@Injectable({
    providedIn: 'root'
})
export class AppLoadService {
    /**
     * Constructor.
     *
     * @param modelMapper
     * @param mainMenuService
     * @param searchService
     */
    public constructor(
        private modelMapper: CollectionStringMapperService,
        private mainMenuService: MainMenuService,
        private searchService: SearchService,
        private injector: Injector
    ) {}

    public async loadApps(): Promise<void> {
        if (plugins.length) {
            console.log('plugins: ', plugins);
        }
        /*for (const pluginName of plugins) {
            const plugin = await import('../../../../../plugins/' + pluginName + '/' + pluginName);
            plugin.main();
        }*/
        const repositories: OnAfterAppsLoaded[] = [];
        appConfigs.forEach((config: AppConfig) => {
            if (config.models) {
                config.models.forEach(entry => {
                    let repository: BaseRepository<any, any> = null;
                    repository = this.injector.get(entry.repository);
                    repositories.push(repository);
                    this.modelMapper.registerCollectionElement(
                        entry.collectionString,
                        entry.model,
                        entry.viewModel,
                        repository
                    );
                    if (this.isSearchableModelEntry(entry)) {
                        this.searchService.registerModel(
                            entry.collectionString,
                            repository,
                            entry.searchOrder,
                            entry.openInNewTab
                        );
                    }
                });
            }
            if (config.mainMenuEntries) {
                this.mainMenuService.registerEntries(config.mainMenuEntries);
            }
        });

        // Collect all services to notify for the OnAfterAppsLoadedHook
        const onAfterAppsLoadedItems = ServicesToLoadOnAppsLoaded.map(service => {
            return this.injector.get(service);
        }).concat(repositories);

        // Notify them.
        onAfterAppsLoadedItems.forEach(repo => {
            repo.onAfterAppsLoaded();
        });
    }

    private isSearchableModelEntry(entry: ModelEntry | SearchableModelEntry): entry is SearchableModelEntry {
        if ((<SearchableModelEntry>entry).searchOrder !== undefined) {
            // We need to double check, because Typescipt cannot check contructors. If typescript could differentiate
            // between  (ModelConstructor<BaseModel>) and (new (...args: any[]) => (BaseModel & Searchable)), we would not have
            // to check if the result of the contructor (the model instance) is really a searchable.
            if (!isSearchable(new entry.viewModel())) {
                throw Error(
                    `Wrong configuration for ${
                        entry.collectionString
                    }: you gave a searchOrder, but the model is not searchable.`
                );
            }
            return true;
        }
        return false;
    }
}
