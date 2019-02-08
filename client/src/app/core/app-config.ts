import { Type } from '@angular/core';

import { ModelConstructor, BaseModel } from '../shared/models/base/base-model';
import { MainMenuEntry } from './core-services/main-menu.service';
import { Searchable } from '../site/base/searchable';
import { BaseRepository } from './repositories/base-repository';
import { BaseViewModel, ViewModelConstructor } from 'app/site/base/base-view-model';

interface BaseModelEntry {
    collectionString: string;
    repository: Type<BaseRepository<any, any>>;
    model: ModelConstructor<BaseModel>;
}

export interface ModelEntry extends BaseModelEntry {
    viewModel: ViewModelConstructor<BaseViewModel>;
}

export interface SearchableModelEntry extends BaseModelEntry {
    viewModel: new (...args: any[]) => BaseViewModel & Searchable;
    searchOrder: number;
}

/**
 * The configuration of an app.
 */
export interface AppConfig {
    /**
     * The name.
     */
    name: string;

    /**
     * All models, that should be registered.
     */
    models?: (ModelEntry | SearchableModelEntry)[];

    /**
     * Main menu entries.
     */
    mainMenuEntries?: MainMenuEntry[];
}
