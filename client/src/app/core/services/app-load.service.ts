import { Injectable } from '@angular/core';
import { plugins } from '../../../plugins';
import { CommonAppConfig } from '../../site/common/common.config';
import { AppConfig, SearchableModelEntry, ModelEntry } from '../../site/base/app-config';
import { CollectionStringModelMapperService } from './collectionStringModelMapper.service';
import { MediafileAppConfig } from '../../site/mediafiles/mediafile.config';
import { MotionsAppConfig } from '../../site/motions/motions.config';
import { ConfigAppConfig } from '../../site/config/config.config';
import { AgendaAppConfig } from '../../site/agenda/agenda.config';
import { AssignmentsAppConfig } from '../../site/assignments/assignments.config';
import { UsersAppConfig } from '../../site/users/users.config';
import { TagAppConfig } from '../../site/tags/tag.config';
import { MainMenuService } from './main-menu.service';
import { HistoryAppConfig } from 'app/site/history/history.config';
import { SearchService } from './search.service';
import { isSearchable } from '../../shared/models/base/searchable';

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
    HistoryAppConfig
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
        private modelMapper: CollectionStringModelMapperService,
        private mainMenuService: MainMenuService,
        private searchService: SearchService
    ) {}

    public async loadApps(): Promise<void> {
        if (plugins.length) {
            console.log('plugins: ', plugins);
        }
        /*for (const pluginName of plugins) {
            const plugin = await import('../../../../../plugins/' + pluginName + '/' + pluginName);
            plugin.main();
        }*/
        appConfigs.forEach((config: AppConfig) => {
            if (config.models) {
                config.models.forEach(entry => {
                    this.modelMapper.registerCollectionElement(entry.collectionString, entry.model);
                    if (this.isSearchableModelEntry(entry)) {
                        this.searchService.registerModel(entry.collectionString, entry.model, entry.searchOrder);
                    }
                });
            }
            if (config.mainMenuEntries) {
                this.mainMenuService.registerEntries(config.mainMenuEntries);
            }
        });
    }

    private isSearchableModelEntry(entry: ModelEntry | SearchableModelEntry): entry is SearchableModelEntry {
        if ((<SearchableModelEntry>entry).searchOrder !== undefined) {
            // We need to double check, because Typescipt cannot check contructors. If typescript could differentiate
            // between  (ModelConstructor<BaseModel>) and (new (...args: any[]) => (BaseModel & Searchable)), we would not have
            // to check if the result of the contructor (the model instance) is really a searchable.
            if (!isSearchable(new entry.model())) {
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
