import { ModelConstructor, BaseModel } from '../shared/models/base/base-model';
import { MainMenuEntry } from './core-services/main-menu.service';
import { Searchable } from '../shared/models/base/searchable';
import { Type } from '@angular/core';
import { BaseRepository } from './repositories/base-repository';

interface BaseModelEntry {
    collectionString: string;
    repository: Type<BaseRepository<any, any>>;
}

export interface ModelEntry extends BaseModelEntry {
    model: ModelConstructor<BaseModel>;
}

export interface SearchableModelEntry extends BaseModelEntry {
    model: new (...args: any[]) => BaseModel & Searchable;
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
