import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { BaseViewModel } from 'app/site/base/base-view-model';
import { BaseRepository } from '../repositories/base-repository';
import { Searchable } from '../../site/base/searchable';
import { ViewModelStoreService } from '../core-services/view-model-store.service';

/**
 * The representation every searchable model should use to represent their data.
 */
export type SearchRepresentation = string[];

/**
 * Our representation of a searchable model for external use.
 */
export interface SearchModel {
    /**
     * The collection string.
     */
    collectionString: string;

    /**
     * The singular verbose name of the model.
     */
    verboseNameSingular: string;

    /**
     * The plural verbose name of the model.
     */
    verboseNamePlural: string;

    /**
     * Whether to open the detail page in a new tab.
     */
    openInNewTab: boolean;
}

/**
 * A search result has the model's collectionstring, a verbose name and the actual models.
 */
export interface SearchResult {
    /**
     * The collection string.
     */
    collectionString: string;

    /**
     * This verbodeName must have the right cardianlity. If there is exactly one model in `models`,
     * it should have a singular value, else a plural name.
     */
    verboseName: string;

    /**
     * Whether to open the detail page in a new tab.
     */
    openInNewTab: boolean;

    /**
     * All matched models sorted by their title.
     */
    models: (BaseViewModel & Searchable)[];
}

/**
 * This service cares about searching the DataStore and managing models, that are searchable.
 */
@Injectable({
    providedIn: 'root'
})
export class SearchService {
    /**
     * All searchable models in our own representation.
     */
    private searchModels: {
        collectionString: string;
        verboseNameSingular: string;
        verboseNamePlural: string;
        displayOrder: number;
        openInNewTab: boolean;
    }[] = [];

    /**
     * For sorting the results.
     */
    private languageCollator: Intl.Collator;

    /**
     * @param viewModelStore The store to search in.
     */
    public constructor(private viewModelStore: ViewModelStoreService, private translate: TranslateService) {
        this.languageCollator = new Intl.Collator(this.translate.currentLang);
        this.translate.onLangChange.subscribe(params => {
            this.languageCollator = new Intl.Collator(params.lang);
        });
    }

    /**
     * Registers a model by the given attributes.
     *
     * @param collectionString The colelction string of the model
     * @param ctor The model constructor
     * @param displayOrder The order in which the elements should be displayed.
     */
    public registerModel(
        collectionString: string,
        repo: BaseRepository<any, any, any>,
        displayOrder: number,
        openInNewTab: boolean = false
    ): void {
        this.searchModels.push({
            collectionString: collectionString,
            verboseNameSingular: repo.getVerboseName(),
            verboseNamePlural: repo.getVerboseName(true),
            displayOrder: displayOrder,
            openInNewTab: openInNewTab
        });
        this.searchModels.sort((a, b) => a.displayOrder - b.displayOrder);
    }

    /**
     * @returns all registered models for the UI.
     */
    public getRegisteredModels(): SearchModel[] {
        return this.searchModels.map(searchModel => ({
            collectionString: searchModel.collectionString,
            verboseNameSingular: searchModel.verboseNameSingular,
            verboseNamePlural: searchModel.verboseNamePlural,
            openInNewTab: searchModel.openInNewTab
        }));
    }

    /**
     * Does the actual searching.
     *
     * @param query The search query
     * @param inCollectionStrings All connection strings which should be used for searching.
     * @param sortingProperty Sorting by `id` or `title`.
     *
     * @returns All search results sorted by the model's title (via `getTitle()`).
     */
    public search(query: string, inCollectionStrings: string[], sortingProperty: 'id' | 'title'): SearchResult[] {
        query = query.toLowerCase();
        return this.searchModels
            .filter(s => inCollectionStrings.includes(s.collectionString))
            .map(searchModel => {
                const results = this.viewModelStore
                    .getAll(searchModel.collectionString)
                    .map(x => x as (BaseViewModel & Searchable))
                    .filter(model => model.formatForSearch().some(text => text.toLowerCase().includes(query)))
                    .sort((a, b) => {
                        switch (sortingProperty) {
                            case 'id':
                                return a.id - b.id;
                            case 'title':
                                return this.languageCollator.compare(a.getTitle(), b.getTitle());
                        }
                    });
                return {
                    collectionString: searchModel.collectionString,
                    verboseName: results.length === 1 ? searchModel.verboseNameSingular : searchModel.verboseNamePlural,
                    openInNewTab: searchModel.openInNewTab,
                    models: results
                };
            });
    }
}
